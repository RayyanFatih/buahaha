import { test, expect, type Page } from "@playwright/test";

const nav = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("button", { name, exact: true })
    .click();
const dialog = (page: Page) => page.getByRole("dialog");
async function save(page: Page) {
  await dialog(page)
    .getByRole("button", { name: "Simpan", exact: true })
    .click();
  await expect(dialog(page)).toHaveCount(0);
}

test("customer → order → delivery → payment → fuel → report persists after reload", async ({
  page,
}) => {
  const errors: string[] = [];
  await page.clock.setFixedTime(new Date("2026-10-01T10:00:00+07:00"));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ringkasan usaha" }),
  ).toBeVisible();
  await nav(page, "Pelanggan");
  await page
    .getByRole("button", { name: "Tambah pelanggan", exact: true })
    .click();
  await dialog(page)
    .getByLabel("Nama pelanggan", { exact: true })
    .fill("Toko Uji Browser");
  await dialog(page).getByLabel("Nomor WhatsApp").fill("081234001122");
  await dialog(page)
    .getByLabel("Alamat pengiriman")
    .fill("Jl. Uji No. 12, Jakarta");
  await save(page);
  await page.reload();
  await nav(page, "Pelanggan");
  await expect(
    page.getByText("Toko Uji Browser", { exact: true }),
  ).toBeVisible();
  await nav(page, "Pesanan");
  await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
  await dialog(page)
    .getByLabel("Pelanggan", { exact: true })
    .selectOption({ label: "Toko Uji Browser" });
  await dialog(page).getByLabel("Jumlah (kg)").fill("5");
  await save(page);
  await page.getByRole("button", { name: "PSN-1007", exact: true }).click();
  await dialog(page)
    .getByRole("button", { name: "Konfirmasi pesanan", exact: true })
    .click();
  await dialog(page)
    .getByRole("button", { name: "Siapkan pesanan", exact: true })
    .click();
  await dialog(page)
    .getByRole("button", { name: "Jadwalkan pengiriman", exact: true })
    .click();
  await dialog(page).getByLabel("Petugas pengiriman").fill("Pak Uji");
  await dialog(page).getByLabel("Kendaraan / nomor polisi").fill("B 1234 UJI");
  await dialog(page)
    .getByLabel("Alamat atau rangkuman rute")
    .fill("Jl. Uji No. 12, Jakarta");
  await save(page);
  await nav(page, "Pengiriman");
  const trip = page.locator(".trip").filter({ hasText: "Pak Uji" });
  await trip.getByRole("button", { name: "Mulai perjalanan" }).click();
  await dialog(page).getByRole("button", { name: "Ya, lanjutkan" }).click();
  await trip.getByRole("button", { name: "Tandai terkirim" }).click();
  await dialog(page).getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(trip.locator(".badge")).toHaveText("Terkirim");
  await trip.getByRole("button", { name: "Catat bensin" }).click();
  await dialog(page).getByLabel("Nominal (Rp)", { exact: true }).fill("25000");
  await dialog(page)
    .getByLabel("Catatan (opsional)")
    .fill("Bensin perjalanan uji");
  await save(page);
  await nav(page, "Pembayaran");
  await page
    .getByRole("button", { name: "Catat pembayaran", exact: true })
    .click();
  await dialog(page)
    .getByLabel("Pesanan", { exact: true })
    .selectOption({ label: "PSN-1007 · Toko Uji Browser" });
  await dialog(page).getByLabel("Metode pembayaran").selectOption("COD");
  await dialog(page).getByLabel("Nominal diterima (Rp)").fill("125000");
  await save(page);
  const payment = page.getByRole("row").filter({ hasText: "Toko Uji Browser" });
  await payment.getByRole("button", { name: "Catat setoran" }).click();
  await dialog(page).getByLabel("Nominal setoran diterima (Rp)").fill("125000");
  await save(page);
  await nav(page, "Laporan");
  await expect(page.locator(".report-lines")).toContainText("125.000");
  await expect(page.locator(".report-lines")).toContainText("25.000");
  await expect(page.locator(".report-total")).toContainText("10.000");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor CSV" }).click();
  expect((await download).suggestedFilename()).toContain("buahaha-laporan");
  await page.reload();
  await nav(page, "Laporan");
  await expect(page.locator(".report-total")).toContainText("10.000");
  expect(errors).toEqual([]);
});

test("transfer evidence, return approval, role simulation, and reset confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Pembayaran");
  await page
    .getByRole("button", { name: "Catat pembayaran", exact: true })
    .click();
  await dialog(page)
    .getByLabel("Pesanan", { exact: true })
    .selectOption({ label: "PSN-1005 · Warung Bu Siti" });
  await dialog(page).getByLabel("Nominal diterima (Rp)").fill("500000");
  await save(page);
  const row = page.getByRole("row").filter({ hasText: "Warung Bu Siti" });
  await row.getByRole("button", { name: "Verifikasi", exact: true }).click();
  await expect(page.locator(".error-banner")).toContainText(
    "Bukti transfer wajib",
  );
  await row.getByRole("button", { name: "Unggah bukti" }).click();
  await dialog(page)
    .locator('input[type="file"]')
    .setInputFiles({
      name: "bukti.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
  await expect(dialog(page).getByText("bukti.png")).toBeVisible();
  await save(page);
  await row.getByRole("button", { name: "Verifikasi", exact: true }).click();
  await expect(row).toContainText("Terverifikasi");
  await nav(page, "Retur");
  await page.getByRole("button", { name: "Setujui", exact: true }).click();
  await dialog(page).getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByRole("table")).toContainText("Disetujui");
  await page
    .getByLabel("Simulasi peran", { exact: true })
    .selectOption("Admin Gudang");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Pembayaran", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Pengaturan demo", exact: true })
    .click();
  await expect(
    dialog(page).getByRole("button", { name: "Reset data demo" }),
  ).toBeDisabled();
  await dialog(page).getByRole("button", { name: "Tutup panel" }).click();
  await page
    .getByLabel("Simulasi peran", { exact: true })
    .selectOption("Owner");
  await page
    .getByRole("button", { name: "Pengaturan demo", exact: true })
    .click();
  await dialog(page).getByRole("button", { name: "Reset data demo" }).click();
  await page
    .getByRole("dialog", { name: "Konfirmasi tindakan" })
    .getByRole("button", { name: "Kembali" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Pengaturan demo" }),
  ).toBeVisible();
  await dialog(page).getByRole("button", { name: "Reset data demo" }).click();
  await page
    .getByRole("dialog", { name: "Konfirmasi tindakan" })
    .getByRole("button", { name: "Ya, lanjutkan" })
    .click();
  await expect(dialog(page)).toHaveCount(0);
  await nav(page, "Retur");
  await expect(page.getByRole("table")).toContainText("Diajukan");
});

test("mobile and tablet navigation stays within viewport; forms and keyboard dismissal work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ringkasan usaha" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Buka menu" }).click();
  await nav(page, "Pelanggan");
  await page
    .getByRole("button", { name: "Tambah pelanggan", exact: true })
    .click();
  await expect(dialog(page).getByLabel("Nama pelanggan")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 820, height: 1180 });
  for (const name of [
    "Ringkasan",
    "Pesanan",
    "Produk & Stok",
    "Pengiriman",
    "Pembayaran",
    "Pengeluaran",
    "Retur",
    "Laporan",
  ]) {
    await nav(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      name,
    ).toBe(true);
  }
});

test("malformed saved data shows recoverable error instead of breaking the app", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("buahaha.demo.v1", "{broken"),
  );
  await page.goto("/");
  await expect(page.locator(".boot [role=alert]")).toContainText(
    "Data lokal tidak dapat dibaca",
  );
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reset data demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Ringkasan usaha" }),
  ).toBeVisible();
});
