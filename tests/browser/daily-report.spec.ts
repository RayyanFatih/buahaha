import { test, expect } from "./fixtures";
import { readFile, mkdir } from "node:fs/promises";
import { demoState } from "../../src/lib/demo";

test("historical daily results, date navigation, range drilldown, and CSV agree", async ({
  page,
}) => {
  const seed = demoState();
  seed.orders[0].date = "2026-09-01";
  seed.orders[0].completedAt = "2026-09-10";
  seed.orders[1].completedAt = "2026-09-11";
  seed.expenses.forEach((e) => {
    e.date = "2026-09-11";
  });
  seed.movements.forEach((m) => {
    m.date = "2026-09-11";
  });
  await page.addInitScript(
    (data) => localStorage.setItem("buahaha.data.v2", JSON.stringify(data)),
    seed,
  );
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Laporan", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Harian", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Tanggal laporan", { exact: true }).fill("2026-09-10");
  await expect(page.locator(".report-total")).toContainText("610.000");
  const sources = page.getByRole("region", {
    name: "Pesanan sumber laporan",
    exact: true,
  });
  await expect(sources).toContainText("PSN-1001");
  await expect(sources).not.toContainText("PSN-1002");
  await page
    .getByRole("button", { name: "Hari berikutnya", exact: true })
    .click();
  await expect(page.getByLabel("Tanggal laporan", { exact: true })).toHaveValue(
    "2026-09-11",
  );
  await expect(page.locator(".report-total")).toContainText("241.000");
  await page
    .getByRole("button", { name: "Hari sebelumnya", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hari sebelumnya", exact: true })
    .click();
  await expect(page.locator(".report-total")).toContainText("Rp 0");
  await expect(sources).toContainText(
    "Belum ada pesanan selesai pada periode ini.",
  );
  await page
    .getByRole("button", { name: "Rentang tanggal", exact: true })
    .click();
  await page.getByLabel("Tanggal mulai", { exact: true }).fill("2026-09-10");
  await page.getByLabel("Tanggal akhir", { exact: true }).fill("2026-09-11");
  await expect(page.locator(".report-total")).toContainText("851.000");
  const daily = page.getByRole("region", {
    name: "Rincian hasil harian",
    exact: true,
  });
  await expect(daily.getByRole("row")).toHaveCount(3);
  await daily
    .getByRole("button", { name: "Lihat hasil 10 Sep 2026", exact: true })
    .click();
  await expect(page.getByLabel("Tanggal laporan", { exact: true })).toHaveValue(
    "2026-09-10",
  );
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor CSV", exact: true }).click();
  const file = await downloading;
  const csv = await readFile((await file.path())!, "utf8");
  expect(csv).toContain('"2026-09-10","1","2150000","1540000","610000"');
  expect(csv).not.toContain("2026-09-11");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("buahaha.data.v2")!),
    ),
  ).toEqual(seed);
  await page
    .getByRole("button", { name: "Rentang tanggal", exact: true })
    .click();
  await page.getByLabel("Tanggal akhir", { exact: true }).fill("2026-09-11");
  await mkdir(".impeccable/review/daily", { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: ".impeccable/review/daily/desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/daily/mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Harian", exact: true }).click();
  await expect(page.getByLabel("Tanggal laporan", { exact: true })).toHaveValue(
    "2026-09-11",
  );
  await page
    .getByRole("button", { name: "Hari sebelumnya", exact: true })
    .click();
  await expect(page.locator(".report-total")).toContainText("610.000");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".impeccable/review/daily/mobile-day.png",
    fullPage: true,
    animations: "disabled",
  });
});
