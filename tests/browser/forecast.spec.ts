import { test, expect } from "./fixtures";
import { shiftDate } from "../../src/lib/forecast";

const history = [
  "tanggal,sku,nama_buah,satuan,jumlah_terjual_kg,stok_akhir_kg,jenis_data",
  ...Array.from(
    { length: 120 },
    (_, i) => `${shiftDate("2026-06-15", i)},B001,Jeruk,kg,20,100,sintetis`,
  ),
].join("\n");

test("upload history, forecast 7 and 30 days, preserve data on invalid upload, persist and remove separately", async ({
  page,
}) => {
  await page.goto("/");
  const operational = await page.evaluate(() =>
    localStorage.getItem("buahaha.data.v2"),
  );
  const nav = () =>
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Prediksi Usaha", exact: true })
      .click();
  await nav();
  await expect(
    page.getByRole("heading", { name: "Lihat arah penjualan Anda" }),
  ).toBeVisible();
  await page
    .getByLabel("File riwayat penjualan")
    .setInputFiles({
      name: "riwayat.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(history),
    });
  const table = page.getByRole("region", {
    name: "Tabel prediksi penjualan dan stok",
  });
  await expect(table).toContainText("140 kg");
  await expect(table).toContainText("40 kg");
  await expect(
    page.getByText("Data simulasi —", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "30 hari", exact: true }).click();
  await expect(table).toContainText("600 kg");
  await expect(table).toContainText("500 kg");
  await page.getByLabel("Cari buah atau SKU").fill("tidak ada");
  await expect(table).toContainText("Tidak ada buah yang cocok");
  await page.getByLabel("Cari buah atau SKU").fill("");
  const exported = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh hasil 30 hari" }).click();
  expect((await exported).suggestedFilename()).toBe(
    "buahaha-prediksi-30-hari.json",
  );
  await page
    .getByLabel("File riwayat penjualan")
    .setInputFiles({
      name: "salah.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("tanggal,pemasukan\n2026-10-12,900"),
    });
  await expect(
    page.getByRole("alert").filter({ hasText: "CSV perlu kolom" }),
  ).toBeVisible();
  await expect(table).toContainText("600 kg");
  await page.reload();
  await nav();
  await expect(table).toContainText("140 kg");
  await page.screenshot({
    path: ".impeccable/review/forecast-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/forecast-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Hapus riwayat prediksi" }).click();
  await expect(table).toContainText("140 kg");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Hapus riwayat prediksi" }).click();
  await expect(
    page.getByRole("heading", { name: "Lihat arah penjualan Anda" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("buahaha.data.v2")),
  ).toBe(operational);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("buahaha.forecast.history.v1"),
    ),
  ).toBeNull();
});
