import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir(".impeccable/review", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://127.0.0.1:3000");
await page.getByRole("heading", { name: "Ringkasan usaha" }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: ".impeccable/review/desktop.png",
  fullPage: true,
  animations: "disabled",
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: ".impeccable/review/mobile.png",
  fullPage: true,
  animations: "disabled",
});
await page.setViewportSize({ width: 820, height: 1180 });
await page.screenshot({
  path: ".impeccable/review/tablet.png",
  fullPage: true,
  animations: "disabled",
});
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
await page.getByRole("dialog").waitFor();
await page.screenshot({
  path: ".impeccable/review/order-form.png",
  fullPage: true,
  animations: "disabled",
});
await page.getByRole("button", { name: "Tutup panel" }).click();
await page
  .getByRole("navigation")
  .getByRole("button", { name: "Laporan", exact: true })
  .click();
await page.screenshot({
  path: ".impeccable/review/report.png",
  fullPage: true,
  animations: "disabled",
});
console.log("Captured desktop, mobile, tablet, order form, and report.");
await browser.close();
