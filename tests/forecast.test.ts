import test from "node:test";
import assert from "node:assert/strict";
import { forecastHistory, parseHistory, shiftDate } from "../src/lib/forecast";

const csv = (qty = 20, stock: number | null = 100) =>
  [
    "tanggal,sku,nama_buah,satuan,jumlah_terjual_kg,stok_akhir_kg,jenis_data",
    ...Array.from(
      { length: 120 },
      (_, i) =>
        `${shiftDate("2026-06-15", i)},P1,"Jeruk, manis",kg,${qty},${stock ?? ""},sintetis`,
    ),
  ].join("\r\n");

test("CSV import accepts quoted names, BOM, semicolon and optional stock without inventing balances", () => {
  const h = parseHistory("\uFEFF" + csv());
  assert.equal(h.products[0].name, "Jeruk, manis");
  assert.equal(h.synthetic, true);
  const semicolon = csv()
    .replace(/,"Jeruk, manis",/g, ",Jeruk,")
    .replaceAll(",", ";");
  assert.equal(parseHistory(semicolon).count, 120);
  const report = forecastHistory(parseHistory(csv(0, null)));
  assert.equal(report.forecasts[30][0].stock, null);
  assert.equal(report.forecasts[30][0].shortage, null);
  assert.equal(report.forecasts[30][0].total, 0);
  assert.equal(report.forecasts[30][0].validation.wape, null);
});

test("rejects duplicate, missing-day, malformed, short and financial-only histories", () => {
  assert.throws(
    () => parseHistory(csv() + "\n" + csv().split("\r\n")[1]),
    /ganda/,
  );
  const lines = csv().split("\r\n");
  lines.splice(30, 1);
  assert.throws(() => parseHistory(lines.join("\n")), /terputus/);
  assert.throws(
    () => parseHistory(csv().replace("2026-06-15", "2026-02-30")),
    /tanggal harus valid/,
  );
  assert.throws(
    () => parseHistory(csv().replace(",kg,20,", ",kg,-20,")),
    /nonnegatif/,
  );
  assert.throws(
    () => parseHistory(csv().replace(",kg,20,", ",dus,20,")),
    /satuan kg/,
  );
  assert.throws(
    () => parseHistory(csv().split("\r\n").slice(0, 80).join("\n")),
    /90 hari/,
  );
  assert.throws(
    () => parseHistory("tanggal,pemasukan,pengeluaran\n2026-10-12,100,50"),
    /belum cukup/,
  );
});

test("both horizons forecast after history end and stock exhaustion uses cumulative unrounded quantities", () => {
  const h = parseHistory(csv()),
    result = forecastHistory(h);
  for (const horizon of [7, 30] as const) {
    const p = result.forecasts[horizon][0];
    assert.equal(p.daily.length, horizon);
    assert.equal(p.daily[0].date, shiftDate(h.through, 1));
    assert.equal(p.daily.at(-1)!.date, shiftDate(h.through, horizon));
    assert.equal(p.method, "Pola mingguan");
    assert.equal(p.total, 20 * horizon);
    assert.equal(p.exhausted, shiftDate(h.through, 5));
    assert.equal(p.shortage, p.total - 100);
    assert.equal(p.validation.selectedMae, 0);
  }
  assert.equal(
    forecastHistory(parseHistory(csv(20, 0))).forecasts[7][0].exhausted,
    h.through,
  );
  assert.equal(
    forecastHistory(parseHistory(csv(20, 1000))).forecasts[30][0].exhausted,
    null,
  );
});

test("weekly backtest never reads holdout actuals as prediction inputs", () => {
  const h = parseHistory(csv());
  h.products[0].rows.slice(-7).forEach((r) => {
    r.qty = 120;
  });
  const result = forecastHistory(h).forecasts[7][0];
  assert.equal(result.validation.weeklyMae, 100);
  assert.ok(Math.abs(result.validation.ridgeMae - 100) < 1e-6);
  assert.ok(result.daily.every((d) => Number.isFinite(d.qty) && d.qty >= 0));
});
