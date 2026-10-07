import { test, expect } from "@playwright/test";

test("delete confirms, protects references, persists, and is Owner-only", async ({
  page,
}) => {
  await page.goto("/");
  const nav = async (name: string) => {
    await page
      .getByRole("navigation")
      .getByRole("button", { name, exact: true })
      .click();
  };
  await expect(page.locator(".topbar .simulation")).toHaveCount(0);
  await nav("Pelanggan");
  await page
    .getByRole("button", { name: "Hapus Toko Buah Segar", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ya, hapus" })
    .click();
  await expect(page.locator(".error-banner")).toContainText(
    "masih memiliki pesanan",
  );
  await expect(page.getByRole("table")).toContainText("Toko Buah Segar");
  await nav("Pesanan");
  await page
    .getByRole("button", { name: "Hapus PSN-1006", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Kembali" })
    .click();
  await expect(
    page.getByRole("button", { name: "Hapus PSN-1006", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hapus PSN-1006", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ya, hapus" })
    .click();
  await expect(
    page.getByRole("button", { name: "Hapus PSN-1006", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await nav("Pesanan");
  await expect(
    page.getByRole("button", { name: "Hapus PSN-1006", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Simulasi peran").selectOption("Admin Gudang");
  await nav("Pesanan");
  await expect(
    page.getByRole("button", { name: "Hapus PSN-1005", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Simulasi peran").selectOption("Owner");
  await nav("Pengiriman");
  await expect(
    page.getByRole("button", { name: "Hapus JLN-001", exact: true }),
  ).toBeVisible();
  await nav("Pembayaran");
  await expect(
    page.getByRole("button", { name: "Hapus BYR-001", exact: true }),
  ).toBeVisible();
  await nav("Retur");
  await page
    .getByRole("button", { name: "Hapus RTR-001", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ya, hapus" })
    .click();
  await expect(
    page.getByRole("button", { name: "Hapus RTR-001", exact: true }),
  ).toHaveCount(0);
  await nav("Pengeluaran");
  await page.getByLabel("Tanggal laporan", { exact: true }).fill("2026-09-30");
  await page
    .getByRole("button", { name: "Hapus BIA-003", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ya, hapus" })
    .click();
  await expect(
    page.getByRole("button", { name: "Hapus BIA-003", exact: true }),
  ).toHaveCount(0);
  await nav("Produk & Stok");
  await expect(
    page.getByRole("button", { name: "Hapus Jeruk Medan", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hapus MUT-R1", exact: true }),
  ).toBeVisible();
});

test("empty data remains usable after removing all records", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "buahaha.demo.v1",
      JSON.stringify({
        version: 1,
        products: [],
        customers: [],
        orders: [],
        trips: [],
        payments: [],
        expenses: [],
        returns: [],
        movements: [],
      }),
    ),
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Pesanan", exact: true })
    .click();
  await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Belum ada produk yang dapat dipesan",
  );
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Simpan", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
