import { test, expect } from "@playwright/test";
import { demoState } from "../../src/lib/demo";

test("old data is removed once and new entries survive refresh without demo settings", async ({
  page,
}) => {
  await page.addInitScript((seed) => {
    localStorage.setItem("buahaha.demo.v1", JSON.stringify(seed));
    localStorage.setItem(
      "buahaha.history.before-september-2026.v1",
      JSON.stringify(seed),
    );
    localStorage.setItem("unrelated-app", "keep");
  }, demoState());
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ringkasan usaha" }),
  ).toBeVisible();
  const stored = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem("buahaha.data.v2")!),
    old: localStorage.getItem("buahaha.demo.v1"),
    backup: localStorage.getItem("buahaha.history.before-september-2026.v1"),
    other: localStorage.getItem("unrelated-app"),
  }));
  expect(
    Object.values(stored.state)
      .filter(Array.isArray)
      .every((rows) => rows.length === 0),
  ).toBe(true);
  expect(stored.old).toBeNull();
  expect(stored.backup).toBeNull();
  expect(stored.other).toBe("keep");
  await expect(
    page.getByRole("button", { name: "Pengaturan demo" }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Pelanggan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tambah pelanggan", exact: true })
    .click();
  await page
    .getByLabel("Nama pelanggan", { exact: true })
    .fill("Pelanggan Baru");
  await page.getByLabel("Nomor WhatsApp").fill("081234567890");
  await page.getByLabel("Alamat pengiriman").fill("Jakarta");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Simpan", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Pelanggan", exact: true })
    .click();
  await expect(page.getByRole("table")).toContainText("Pelanggan Baru");
  await expect(page.getByRole("table")).not.toContainText("Toko Buah Segar");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("first visit starts empty without sample products or orders", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ringkasan usaha" }),
  ).toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("buahaha.data.v2")!),
  );
  expect(state.products).toEqual([]);
  expect(state.orders).toEqual([]);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Pesanan", exact: true })
    .click();
  await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Belum ada produk");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Simpan", exact: true }),
  ).toBeDisabled();
});
