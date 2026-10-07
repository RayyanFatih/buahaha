import { test, expect } from "./fixtures";

test("delete lives inside edit panels, confirms, protects references and persists", async ({
  page,
}) => {
  await page.goto("/");
  const nav = async (name: string) =>
    page
      .getByRole("navigation")
      .getByRole("button", { name, exact: true })
      .click();
  const close = async () =>
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Tutup panel", exact: true })
      .click();
  const confirm = async () =>
    page
      .getByRole("dialog", { name: "Konfirmasi tindakan" })
      .getByRole("button", { name: "Ya, hapus" })
      .click();
  await expect(page.locator(".topbar .simulation")).toHaveCount(0);
  await nav("Pelanggan");
  await expect(page.getByRole("button", { name: /^Hapus / })).toHaveCount(0);
  await page
    .getByRole("row")
    .filter({ hasText: "Toko Buah Segar" })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hapus Toko Buah Segar", exact: true })
    .click();
  await confirm();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "masih memiliki pesanan",
  );
  await close();
  await nav("Pesanan");
  await expect(page.getByRole("button", { name: /^Hapus / })).toHaveCount(0);
  const editOrder = page.getByRole("button", {
    name: "Edit PSN-1006",
    exact: true,
  });
  await expect(editOrder).toHaveText("Edit");
  await editOrder.click();
  await page
    .getByRole("dialog", { name: "Edit pesanan" })
    .getByRole("button", { name: "Hapus PSN-1006", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Konfirmasi tindakan" })
    .getByRole("button", { name: "Kembali", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Edit pesanan" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hapus PSN-1006", exact: true })
    .click();
  await confirm();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(editOrder).toHaveCount(0);
  await page.reload();
  await nav("Pesanan");
  await expect(editOrder).toHaveCount(0);
  await page.getByLabel("Simulasi peran").selectOption("Admin Gudang");
  await nav("Pesanan");
  await page
    .getByRole("button", { name: "Edit PSN-1005", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Hapus PSN-1005", exact: true }),
  ).toBeDisabled();
  await close();
  await page.getByLabel("Simulasi peran").selectOption("Owner");
  await nav("Produk & Stok");
  await expect(page.getByRole("button", { name: /^Hapus / })).toHaveCount(0);
  await page
    .getByRole("row")
    .filter({ hasText: "BH-JRK-001" })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Hapus Jeruk Medan", exact: true }),
  ).toBeVisible();
  await close();
  await page.getByRole("button", { name: "Edit MUT-R1", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hapus MUT-R1", exact: true })
    .click();
  await confirm();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit MUT-R1", exact: true }),
  ).toHaveCount(0);
  await nav("Pengiriman");
  await expect(
    page.getByRole("button", { name: "Hapus JLN-001", exact: true }),
  ).toBeVisible();
  await nav("Pembayaran");
  await expect(
    page.getByRole("button", { name: "Hapus BYR-001", exact: true }),
  ).toBeVisible();
});
test("empty data remains usable after removing all records", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "buahaha.data.v2",
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
