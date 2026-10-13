// Browser-side forecasting: no operational records are created or modified.
export type Horizon = 7 | 30;
export type HistoryRow = { date: string; qty: number; stock: number | null };
export type HistoryProduct = { sku: string; name: string; rows: HistoryRow[] };
export type History = {
  products: HistoryProduct[];
  from: string;
  through: string;
  count: number;
  synthetic: boolean;
  stockouts: number;
};
export type ProductForecast = {
  sku: string;
  name: string;
  daily: { date: string; qty: number }[];
  total: number;
  stock: number | null;
  shortage: number | null;
  exhausted: string | null;
  method: "Regresi ridge" | "Pola mingguan";
  validation: {
    days: number;
    ridgeMae: number;
    weeklyMae: number;
    selectedMae: number;
    wape: number | null;
  };
};
export type ForecastReport = {
  from: string;
  through: string;
  count: number;
  synthetic: boolean;
  stockouts: number;
  forecasts: Record<Horizon, ProductForecast[]>;
};
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const shiftDate = (date: string, days: number) =>
  new Date(Date.parse(date + "T00:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);

// Supports UTF-8 BOM, quoted fields, escaped quotes, CRLF and comma/semicolon CSV.
function csvRows(text: string): string[][] {
  if (text.length > MAX_CSV_BYTES)
    throw new Error("CSV terlalu besar. Maksimal 5 MB.");
  text = text.replace(/^\uFEFF/, "");
  const head = text.split(/\r?\n/, 1)[0];
  const delimiter = head.includes(";") && !head.includes(",") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    closed = false;
  const endField = () => {
    row.push(field.trim());
    field = "";
    closed = false;
    if (row.length > 64) throw new Error("Terlalu banyak kolom CSV.");
  };
  const endRow = () => {
    endField();
    if (row.some(Boolean)) rows.push(row);
    row = [];
    if (rows.length > 100001)
      throw new Error("Maksimal 100.000 baris riwayat.");
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += c;
    } else if (c === delimiter) endField();
    else if (c === "\n" || c === "\r") {
      endRow();
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else if (c === '"' && !field && !closed) quoted = true;
    else if (closed && !/\s/.test(c))
      throw new Error("Format kutip pada CSV tidak valid.");
    else field += c;
  }
  if (quoted) throw new Error("Ada tanda kutip CSV yang belum ditutup.");
  if (field || row.length) endRow();
  return rows;
}

export function parseHistory(text: string): History {
  const rows = csvRows(text),
    headers = rows.shift()?.map((h) => h.toLowerCase()) || [];
  const required = ["tanggal", "sku", "nama_buah", "jumlah_terjual_kg"];
  if (!required.every((h) => headers.includes(h)))
    throw new Error(
      "CSV perlu kolom tanggal, sku, nama_buah, jumlah_terjual_kg. Riwayat pemasukan/pengeluaran saja belum cukup untuk prediksi per buah.",
    );
  if (new Set(headers).size !== headers.length)
    throw new Error("Nama kolom CSV tidak boleh ganda.");
  const groups = new Map<string, HistoryProduct>();
  const seen = new Set<string>();
  let synthetic = false,
    stockouts = 0;
  for (const [i, cells] of rows.entries()) {
    if (cells.length !== headers.length)
      throw new Error(`Jumlah kolom berbeda pada baris ${i + 2}.`);
    const r = Object.fromEntries(headers.map((h, j) => [h, cells[j]]));
    const fail = (message: string): never => {
      throw new Error(`Baris ${i + 2}: ${message}`);
    };
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(r.tanggal) ||
      !Number.isFinite(Date.parse(r.tanggal + "T00:00:00Z")) ||
      shiftDate(r.tanggal, 0) !== r.tanggal
    )
      fail("tanggal harus valid dalam format YYYY-MM-DD.");
    if (!r.sku || !r.nama_buah || r.sku.length > 80 || r.nama_buah.length > 160)
      fail("SKU dan nama buah wajib diisi, maksimal 80 dan 160 karakter.");
    if (r.satuan && r.satuan.toLowerCase() !== "kg")
      fail("gunakan satuan kg; jangan gabungkan dus, buah, dan kg.");
    const number = (value: string, label: string) => {
      if (
        !value ||
        !/^\d+(\.\d+)?$/.test(value) ||
        !Number.isFinite(Number(value)) ||
        Number(value) > 1e9
      )
        return fail(
          `${label} harus angka nonnegatif tanpa pemisah ribuan (desimal memakai titik).`,
        );
      return Number(value);
    };
    const qty = number(r.jumlah_terjual_kg, "jumlah terjual");
    const stock = r.stok_akhir_kg
      ? number(r.stok_akhir_kg, "stok akhir")
      : null;
    if (r.operasional && !["0", "1"].includes(r.operasional))
      fail("operasional harus 0 atau 1.");
    if (r.operasional === "0" && qty !== 0)
      fail("hari tutup harus memiliki jumlah terjual 0.");
    if (r.stok_habis && !["0", "1"].includes(r.stok_habis))
      fail("stok_habis harus 0 atau 1.");
    synthetic ||= ["sintetis", "dummy", "simulasi"].includes(
      r.jenis_data?.toLowerCase(),
    );
    stockouts += r.stok_habis === "1" ? 1 : 0;
    const key = JSON.stringify([r.sku, r.tanggal]);
    if (seen.has(key))
      fail(
        `tanggal dan SKU ${r.sku} ganda. Gabungkan transaksi menjadi total harian.`,
      );
    seen.add(key);
    const group = groups.get(r.sku) || {
      sku: r.sku,
      name: r.nama_buah,
      rows: [],
    };
    if (group.name !== r.nama_buah)
      fail(`nama buah untuk SKU ${r.sku} tidak konsisten.`);
    group.rows.push({ date: r.tanggal, qty, stock });
    groups.set(r.sku, group);
  }
  if (!groups.size || groups.size > 100)
    throw new Error("CSV harus berisi 1–100 SKU.");
  const products = [...groups.values()].sort((a, b) =>
    a.sku.localeCompare(b.sku),
  );
  for (const p of products) {
    p.rows.sort((a, b) => a.date.localeCompare(b.date));
    if (p.rows.length < 90)
      throw new Error(
        `${p.sku}: perlu minimal 90 hari lengkap untuk pelatihan dan uji historis.`,
      );
    for (let i = 1; i < p.rows.length; i++)
      if (shiftDate(p.rows[i - 1].date, 1) !== p.rows[i].date)
        throw new Error(
          `${p.sku}: riwayat terputus sebelum ${p.rows[i].date}. Tambahkan hari tanpa penjualan dengan jumlah 0 hanya jika memang tidak ada penjualan.`,
        );
  }
  const through = products[0].rows.at(-1)!.date;
  if (products.some((p) => p.rows.at(-1)!.date !== through))
    throw new Error(
      "Tanggal akhir semua SKU harus sama agar periode prediksi konsisten.",
    );
  return {
    products,
    from: products.map((p) => p.rows[0].date).sort()[0],
    through,
    count: rows.length,
    synthetic,
    stockouts,
  };
}

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
function features(q: number[], index: number, date: string): number[] {
  const day = new Date(date + "T00:00:00Z").getUTCDay();
  return [
    q[index - 1],
    q[index - 7],
    q[index - 14],
    mean(q.slice(index - 7, index)),
    mean(q.slice(index - 28, index)),
    Math.sin((day * 2 * Math.PI) / 7),
    Math.cos((day * 2 * Math.PI) / 7),
  ];
}
function solve(matrix: number[][], target: number[]): number[] {
  const a = matrix.map((row, i) => [...row, target[i]]),
    n = a.length;
  for (let k = 0; k < n; k++) {
    let pivot = k;
    for (let i = k + 1; i < n; i++)
      if (Math.abs(a[i][k]) > Math.abs(a[pivot][k])) pivot = i;
    [a[k], a[pivot]] = [a[pivot], a[k]];
    if (Math.abs(a[k][k]) < 1e-10)
      throw new Error("Model tidak dapat dihitung dari riwayat ini.");
    const scale = a[k][k];
    for (let j = k; j <= n; j++) a[k][j] /= scale;
    for (let i = 0; i < n; i++)
      if (i !== k) {
        const ratio = a[i][k];
        for (let j = k; j <= n; j++) a[i][j] -= ratio * a[k][j];
      }
  }
  return a.map((row) => row[n]);
}
function ridge(rows: HistoryRow[], horizon: number): number[] {
  const q = rows.map((r) => r.qty),
    x = rows.slice(28).map((r, i) => features(q, i + 28, r.date));
  const means = x[0].map((_, j) => mean(x.map((r) => r[j])));
  const scales = means.map(
    (m, j) => Math.sqrt(mean(x.map((r) => (r[j] - m) ** 2))) || 1,
  );
  const normalize = (r: number[]) => [
    1,
    ...r.map((v, j) => (v - means[j]) / scales[j]),
  ];
  const n = means.length + 1,
    matrix = Array.from({ length: n }, () => Array<number>(n).fill(0)),
    target = Array<number>(n).fill(0);
  x.forEach((row, i) => {
    const r = normalize(row);
    for (let j = 0; j < n; j++) {
      target[j] += r[j] * q[i + 28];
      for (let k = 0; k < n; k++) matrix[j][k] += r[j] * r[k];
    }
  });
  for (let j = 1; j < n; j++) matrix[j][j] += 10;
  const weights = solve(matrix, target),
    predictions: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const f = normalize(features(q, q.length, shiftDate(rows.at(-1)!.date, h)));
    const prediction = Math.max(
      0,
      f.reduce((sum, v, j) => sum + v * weights[j], 0),
    );
    if (!Number.isFinite(prediction))
      throw new Error("Hasil model tidak valid. Periksa nilai pada riwayat.");
    q.push(prediction);
    predictions.push(prediction);
  }
  return predictions;
}
function weekly(rows: HistoryRow[], horizon: number): number[] {
  // Fixed weekly profile from the last four observed weeks, never future actuals.
  return Array.from({ length: horizon }, (_, h) =>
    mean(
      [0, 1, 2, 3].map(
        (week) => rows[rows.length - 7 + (h % 7) - week * 7].qty,
      ),
    ),
  );
}
function forecastProduct(p: HistoryProduct, horizon: Horizon): ProductForecast {
  const days = horizon,
    train = p.rows.slice(0, -days),
    actual = p.rows.slice(-days).map((r) => r.qty);
  const r = ridge(train, days),
    w = weekly(train, days);
  const mae = (pred: number[]) =>
    mean(pred.map((v, i) => Math.abs(v - actual[i])));
  const ridgeMae = mae(r),
    weeklyMae = mae(w),
    useRidge = ridgeMae < weeklyMae;
  const selectedMae = useRidge ? ridgeMae : weeklyMae;
  const predictions = useRidge
    ? ridge(p.rows, horizon)
    : weekly(p.rows, horizon);
  const daily = predictions.map((qty, i) => ({
    date: shiftDate(p.rows.at(-1)!.date, i + 1),
    qty,
  }));
  const total = predictions.reduce((a, b) => a + b, 0),
    stock = p.rows.at(-1)!.stock;
  let running = 0,
    exhausted: string | null = stock === 0 ? p.rows.at(-1)!.date : null;
  for (const day of daily) {
    running += day.qty;
    if (stock !== null && stock > 0 && running >= stock && exhausted === null)
      exhausted = day.date;
  }
  return {
    sku: p.sku,
    name: p.name,
    daily,
    total,
    stock,
    shortage: stock === null ? null : Math.max(0, total - stock),
    exhausted,
    method: useRidge ? "Regresi ridge" : "Pola mingguan",
    validation: {
      days,
      ridgeMae,
      weeklyMae,
      selectedMae,
      wape: mean(actual) ? (selectedMae / mean(actual)) * 100 : null,
    },
  };
}
export function forecastHistory(history: History): ForecastReport {
  const { products, ...meta } = history;
  return {
    ...meta,
    forecasts: {
      7: products.map((p) => forecastProduct(p, 7)),
      30: products.map((p) => forecastProduct(p, 30)),
    },
  };
}
