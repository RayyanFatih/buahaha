"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileUp, TrendingUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateLabel, quantity, today } from "@/lib/domain";
import { download } from "@/lib/store";
import {
  MAX_CSV_BYTES,
  shiftDate,
  type ForecastReport,
  type Horizon,
  type ProductForecast,
} from "@/lib/forecast";

const STORAGE_KEY = "buahaha.forecast.history.v1";
function ForecastChart({ product }: { product: ProductForecast }) {
  const max = Math.max(1, ...product.daily.map((d) => d.qty));
  const x = (i: number) => 65 + (i / (product.daily.length - 1)) * 695;
  const y = (q: number) => 220 - (q / max) * 175;
  return (
    <svg
      className="forecast-chart"
      viewBox="0 0 800 275"
      role="img"
      aria-label={`Grafik prediksi ${product.name}, ${product.daily.length} hari. Total ${quantity(product.total)} kg. Rincian tersedia pada tabel harian.`}
    >
      {[0, 0.5, 1].map((scale) => (
        <g key={scale}>
          <line
            x1="65"
            x2="760"
            y1={y(max * scale)}
            y2={y(max * scale)}
            className="forecast-grid"
          />
          <text x="55" y={y(max * scale) + 4} textAnchor="end">
            {quantity(max * scale)}
          </text>
        </g>
      ))}
      <text x="65" y="23">
        kg / hari
      </text>
      <polyline
        points={product.daily.map((d, i) => `${x(i)},${y(d.qty)}`).join(" ")}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {product.daily.map((d, i) => (
        <circle
          key={d.date}
          cx={x(i)}
          cy={y(d.qty)}
          r="3"
          fill="var(--primary)"
        >
          <title>
            {dateLabel(d.date)}: {quantity(d.qty)} kg
          </title>
        </circle>
      ))}
      {[0, Math.floor(product.daily.length / 2), product.daily.length - 1].map(
        (i) => (
          <text
            key={i}
            x={x(i)}
            y="254"
            textAnchor={
              i === 0
                ? "start"
                : i === product.daily.length - 1
                  ? "end"
                  : "middle"
            }
          >
            {dateLabel(product.daily[i].date)}
          </text>
        ),
      )}
    </svg>
  );
}

export function ForecastPanel() {
  const [report, setReport] = useState<ForecastReport | null>(null);
  const [filename, setFilename] = useState("");
  const [horizon, setHorizon] = useState<Horizon>(7);
  const [sku, setSku] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const worker = useRef<Worker | null>(null);
  const pending = useRef<{ text: string; name: string; save: boolean } | null>(
    null,
  );
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    const processor = new Worker(
      new URL("../lib/forecast.worker.ts", import.meta.url),
    );
    worker.current = processor;
    processor.onmessage = (
      event: MessageEvent<{ error?: string; report?: ForecastReport }>,
    ) => {
      if (!active) return;
      setBusy(false);
      const data = pending.current;
      if (event.data.error || !event.data.report || !data) {
        setError(event.data.error || "Hasil tidak dapat dibaca.");
        return;
      }
      if (event.data.report.through > today()) {
        setError(
          "Riwayat berisi tanggal masa depan. Gunakan penjualan yang sudah terjadi.",
        );
        return;
      }
      setReport(event.data.report);
      setFilename(data.name);
      setError("");
      if (data.save) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ text: data.text, name: data.name }),
          );
          setNotice(
            "Prediksi diperbarui dan riwayat tersimpan di browser ini.",
          );
        } catch {
          setNotice(
            "Prediksi tersedia untuk sesi ini, tetapi gagal disimpan. Penyimpanan browser penuh atau diblokir; unggah kembali setelah refresh.",
          );
        }
      }
    };
    processor.onerror = () => {
      if (active) {
        setBusy(false);
        setError(
          "Perhitungan gagal. Muat ulang halaman lalu coba unggah kembali.",
        );
      }
    };
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (
          typeof saved.text !== "string" ||
          typeof saved.name !== "string" ||
          saved.text.length > MAX_CSV_BYTES
        )
          throw new Error();
        pending.current = { ...saved, save: false };
        setBusy(true);
        processor.postMessage({ text: saved.text });
      } catch {
        setError(
          "Riwayat prediksi tersimpan tidak dapat dibaca. Unggah CSV kembali untuk menggantinya.",
        );
      }
    });
    return () => {
      active = false;
      processor.terminate();
      worker.current = null;
    };
  }, []);

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setNotice("");
    if (
      !file.name.toLowerCase().endsWith(".csv") ||
      file.size > MAX_CSV_BYTES
    ) {
      setError(
        "Pilih file CSV, maksimal 5 MB. File JSON hasil Colab bukan riwayat untuk pelatihan ini.",
      );
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      if (!worker.current)
        throw new Error("Pemroses belum tersedia. Muat ulang halaman.");
      pending.current = { text, name: file.name, save: true };
      worker.current.postMessage({ text });
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "File gagal dibaca.");
    }
  }
  function template() {
    const lines = [
      "tanggal,sku,nama_buah,satuan,jumlah_terjual_kg,stok_akhir_kg,jenis_data",
    ];
    for (let i = 90; i > 0; i--)
      lines.push(
        `${shiftDate(today(), -i)},CONTOH-01,Jeruk contoh,kg,${20 + (i % 7)},200,sintetis`,
      );
    download(
      "buahaha-template-riwayat.csv",
      lines.join("\n"),
      "text/csv;charset=utf-8",
    );
  }
  function remove() {
    if (
      !window.confirm(
        "Hapus riwayat dan hasil prediksi dari browser ini? Transaksi operasional tetap tersimpan.",
      )
    )
      return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      setReport(null);
      setFilename("");
      setError("");
      setNotice("Riwayat prediksi dihapus.");
    } catch {
      setError("Riwayat tidak dapat dihapus dari penyimpanan browser.");
    }
  }
  const forecasts = report?.forecasts[horizon] || [];
  const product = forecasts.find((p) => p.sku === sku) || forecasts[0];
  const filtered = forecasts.filter((p) =>
    `${p.sku} ${p.name}`.toLowerCase().includes(search.toLowerCase().trim()),
  );
  const risk = forecasts.filter((p) => p.exhausted !== null).length;
  return (
    <div className="forecast-page" aria-busy={busy}>
      <section
        className="panel forecast-upload"
        aria-label="Unggah riwayat penjualan"
      >
        <div>
          <h2>
            {report
              ? "Perbarui riwayat penjualan"
              : "Lihat arah penjualan Anda"}
          </h2>
          <p>
            Unggah penjualan harian per buah. Kami menghitung perkiraan 7 dan 30
            hari dari pola riwayat Anda.
          </p>
          <p className="muted">
            CSV · maksimal 5 MB · minimal 90 hari lengkap per SKU
          </p>
        </div>
        <div className="forecast-upload-actions">
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            aria-label="File riwayat penjualan"
            disabled={busy}
            className="sr-only"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button disabled={busy} onClick={() => input.current?.click()}>
            <FileUp size={17} />
            {busy ? "Menghitung prediksi…" : "Unggah riwayat CSV"}
          </Button>
          <Button variant="outline" onClick={template}>
            <Download size={16} />
            Unduh contoh CSV
          </Button>
        </div>
        <details className="forecast-format">
          <summary>Format data dan cara perhitungan</summary>
          <p>
            Kolom wajib: <code>tanggal, sku, nama_buah, jumlah_terjual_kg</code>
            . Tambahkan <code>stok_akhir_kg</code> untuk perkiraan stok. Tanggal
            memakai YYYY-MM-DD, angka tanpa pemisah ribuan, desimal memakai
            titik. Satu baris per tanggal dan SKU; hari tanpa penjualan tetap
            dicatat 0.
          </p>
          <p>
            CSV dummy buahaha dapat langsung diunggah. Rekap kas, PDF, Excel,
            dan JSON hasil Colab belum didukung. Jumlah pemasukan saja tidak
            menunjukkan berapa kg buah yang terjual.
          </p>
          <p>
            Model regresi ridge belajar dari penjualan sebelumnya dan hari dalam
            minggu, lalu dibandingkan dengan rata-rata empat minggu terakhir
            pada hari yang sama. Pilihan metode memakai uji historis 7 atau 30
            hari terakhir sesuai periode. Ini model lokal, berbeda dari model
            gradient boosting di Colab.
          </p>
          <p>
            File diproses dan disimpan di browser ini. Unggah baru mengganti
            riwayat prediksi sebelumnya, tanpa mengubah produk, pesanan,
            pembayaran, atau laporan.
          </p>
        </details>
      </section>
      {busy && (
        <p role="status" className="forecast-message">
          Memeriksa riwayat dan menguji model untuk kedua periode…
        </p>
      )}
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="forecast-message">
          {notice}
        </p>
      )}
      {!report && !busy && (
        <div className="forecast-empty">
          <TrendingUp size={36} strokeWidth={1.5} />
          <h2>Dari riwayat menjadi rencana stok</h2>
          <p>
            Setelah file diunggah, lihat perkiraan penjualan per buah dan kapan
            stok akhir riwayat diperkirakan habis.
          </p>
          <p>Belum memiliki file? Unduh contoh CSV untuk mencoba alurnya.</p>
        </div>
      )}
      {report && (
        <>
          <div className="forecast-toolbar">
            <div>
              <strong>{filename}</strong>
              <p>
                {quantity(report.count)} baris · {forecasts.length} buah ·
                riwayat {dateLabel(report.from)}–{dateLabel(report.through)}
              </p>
            </div>
            <div
              className="forecast-period"
              role="group"
              aria-label="Periode prediksi"
            >
              {([7, 30] as const).map((h) => (
                <button
                  key={h}
                  aria-pressed={horizon === h}
                  onClick={() => setHorizon(h)}
                >
                  {h === 7 ? "7 hari" : "30 hari"}
                </button>
              ))}
            </div>
          </div>
          {report.synthetic && (
            <p className="forecast-warning">
              Data simulasi — hasil berasal dari riwayat sintetis, bukan bukti
              akurasi penjualan nyata.
            </p>
          )}
          {report.through < shiftDate(today(), -1) && (
            <p className="forecast-warning">
              Riwayat belum diperbarui hingga kemarin. Perkiraan dimulai setelah{" "}
              {dateLabel(report.through)}, bukan dari hari ini. Unggah data
              terbaru untuk rencana terkini.
            </p>
          )}
          <div className="forecast-outlook">
            <div>
              <h2>
                {dateLabel(shiftDate(report.through, 1))}–
                {dateLabel(shiftDate(report.through, horizon))}
              </h2>
              <p>
                {risk
                  ? `${risk} dari ${forecasts.length} buah diperkirakan kehabisan stok dalam periode ini.`
                  : "Belum ada stok yang diperkirakan habis berdasarkan data yang tersedia."}
              </p>
            </div>
            <span>{horizon} hari ke depan</span>
          </div>
          <section
            className="panel forecast-results"
            aria-label="Perkiraan penjualan dan stok"
          >
            <div className="section-heading">
              <div>
                <h2>Rencana penjualan & stok</h2>
                <p>
                  Stok berasal dari saldo akhir CSV per{" "}
                  {dateLabel(report.through)}.
                </p>
              </div>
              <label className="forecast-search">
                Cari buah atau SKU
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nama buah atau SKU"
                />
              </label>
            </div>
            <p className="forecast-scroll-hint">
              Geser tabel untuk melihat semua kolom pada layar kecil.
            </p>
            <div
              className="forecast-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Tabel prediksi penjualan dan stok"
            >
              <table>
                <thead>
                  <tr>
                    {[
                      "Buah / SKU",
                      `Penjualan ${horizon} hari`,
                      "Stok akhir CSV",
                      "Perkiraan stok habis",
                      "Kekurangan",
                      "Metode",
                    ].map((s) => (
                      <th key={s}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.sku}>
                      <td>
                        <button
                          className="text-link"
                          onClick={() => setSku(p.sku)}
                          aria-label={`Lihat prediksi ${p.name}`}
                        >
                          {p.name}
                        </button>
                        <small>{p.sku}</small>
                      </td>
                      <td>{quantity(p.total)} kg</td>
                      <td>
                        {p.stock === null
                          ? "Belum tersedia"
                          : `${quantity(p.stock)} kg`}
                      </td>
                      <td>
                        {p.stock === null
                          ? "Perlu data stok"
                          : p.stock === 0
                            ? "Sudah kosong"
                            : p.exhausted
                              ? dateLabel(p.exhausted)
                              : `Cukup untuk ${horizon} hari`}
                      </td>
                      <td
                        className={
                          p.shortage && p.shortage > 0 ? "forecast-risk" : ""
                        }
                      >
                        {p.shortage === null
                          ? "—"
                          : `${quantity(p.shortage)} kg`}
                      </td>
                      <td>{p.method}</td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={6}>
                        Tidak ada buah yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="forecast-assumption">
              Tanpa tambahan stok, pesanan terikat, retur, atau kerusakan baru.
              Stok CSV belum terhubung ke stok operasional buahaha. Kekurangan
              adalah selisih perkiraan penjualan dengan stok, bukan instruksi
              pembelian otomatis.
            </p>
          </section>
          {product && (
            <section
              className="panel forecast-detail"
              aria-label="Detail prediksi buah"
            >
              <div className="section-heading">
                <div>
                  <h2>Pola penjualan {product.name}</h2>
                  <p>Perkiraan per hari, dalam kilogram.</p>
                </div>
                <label>
                  Buah yang ditampilkan
                  <select
                    value={product.sku}
                    onChange={(e) => setSku(e.target.value)}
                  >
                    {forecasts.map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.name} · {p.sku}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div
                className="forecast-chart-scroll"
                tabIndex={0}
                role="region"
                aria-label="Grafik penjualan, geser untuk melihat seluruh periode"
              >
                <ForecastChart product={product} />
              </div>
              <div className="forecast-evaluation">
                <strong>{product.method}</strong>
                <p>
                  Uji historis {product.validation.days} hari: rata-rata selisih{" "}
                  {quantity(product.validation.selectedMae)} kg/hari (MAE).
                  Regresi: {quantity(product.validation.ridgeMae)} kg; pola
                  mingguan: {quantity(product.validation.weeklyMae)} kg.
                </p>
                <p>
                  {product.validation.wape === null
                    ? "WAPE tidak tersedia karena penjualan aktual pada periode uji bernilai nol."
                    : `Kesalahan relatif (WAPE): ${quantity(product.validation.wape)}%. Ini bukan persentase akurasi.`}{" "}
                  Periode uji digunakan untuk memilih metode; belum ada
                  pengujian independen atau rentang ketidakpastian. Prediksi 30
                  hari lebih tidak pasti.
                </p>
              </div>
              <details className="forecast-daily">
                <summary>Lihat angka harian {product.name}</summary>
                <div className="forecast-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Prediksi penjualan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.daily.map((d) => (
                        <tr key={d.date}>
                          <td>{dateLabel(d.date)}</td>
                          <td>{quantity(d.qty)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          )}
          <p className="forecast-assumption">
            Prediksi mempelajari penjualan tercatat, bukan seluruh permintaan
            pelanggan.{" "}
            {report.stockouts > 0
              ? `Ada ${quantity(report.stockouts)} baris dengan stok habis; penjualan pada hari tersebut mungkin tertahan oleh persediaan.`
              : "Jika barang pernah habis, permintaan yang tidak terpenuhi belum diperhitungkan."}{" "}
            Jadwal tutup dan promosi mendatang belum dimasukkan.
          </p>
          <div className="forecast-footer">
            <Button
              variant="outline"
              onClick={() =>
                download(
                  `buahaha-prediksi-${horizon}-hari.json`,
                  JSON.stringify(
                    {
                      version: 1,
                      source: "buahaha-browser",
                      sourceFile: filename,
                      historyThrough: report.through,
                      horizon,
                      synthetic: report.synthetic,
                      predictions: forecasts,
                    },
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              <Download size={16} />
              Unduh hasil {horizon} hari
            </Button>
            <Button variant="destructive" disabled={busy} onClick={remove}>
              <Trash2 size={16} />
              Hapus riwayat prediksi
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
