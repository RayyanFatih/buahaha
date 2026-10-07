import { test, expect } from "@playwright/test";

test("shipping search keeps selections visible and excludes unavailable orders", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("button", { name: "Pengiriman", exact: true }).click();
  await page.getByLabel("Cari pengiriman").fill("PSN-1003");
  await expect(page.locator(".trip")).toHaveCount(1);
  await page.getByLabel("Cari pengiriman").fill("Hotel Taman Kota");
  await expect(page.locator(".trip")).toHaveCount(1);
  await page.getByRole("button", { name: "Jadwalkan pengiriman", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("summary").click();
  const search = dialog.getByLabel("Cari pesanan siap kirim");
  await search.fill("PSN-1003");
  await expect(dialog.getByText("Tidak ada pesanan yang cocok.", { exact: false })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Simpan", exact: true })).toBeDisabled();
  await search.fill("Dapur Ibu Rani");
  await dialog.getByRole("checkbox").check();
  await search.fill("tidak ditemukan");
  await expect(dialog.locator(".shipping-selection")).toContainText("PSN-1004");
  await dialog.locator("summary").click();
  await expect(dialog.locator(".shipping-selection")).toContainText("Dapur Ibu Rani");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".impeccable/review/shipping-picker-mobile.png", animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.getByRole("button", { name: "Hapus pilihan PSN-1004" }).click();
  await expect(dialog.getByRole("button", { name: "Simpan", exact: true })).toBeDisabled();
});
