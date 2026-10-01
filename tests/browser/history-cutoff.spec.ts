import { test, expect } from "@playwright/test";
import { demoState } from "../../src/lib/demo";

test("existing October demo becomes September history with downloadable original backup", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-01T10:00:00+07:00"));
  const seed = demoState();
  for (const rows of [
    seed.orders,
    seed.payments,
    seed.trips,
    seed.expenses,
    seed.returns,
    seed.movements,
  ]) {
    rows.forEach((row) => {
      row.date = "2026-10-01";
    });
  }
  seed.orders.forEach((order) => {
    if (order.completedAt) order.completedAt = "2026-10-01";
  });
  await page.addInitScript((data) => {
    if (!localStorage.getItem("buahaha.demo.v1"))
      localStorage.setItem("buahaha.demo.v1", JSON.stringify(data));
  }, seed);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ringkasan usaha" }),
  ).toBeVisible();
  await expect(
    page.getByText("Ruang demo interaktif", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".sidebar-bottom")).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Laporan", exact: true })
    .click();
  await expect(page.getByLabel("Tanggal laporan", { exact: true })).toHaveValue(
    "2026-10-01",
  );
  await expect(page.locator(".report-total")).toContainText(/Rp\s*0/);
  await page.getByLabel("Tanggal laporan", { exact: true }).fill("2026-09-30");
  await expect(page.locator(".report-total")).toContainText("851.000");
  await page
    .getByRole("button", { name: "Pengaturan demo", exact: true })
    .click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Unduh data sebelum penyesuaian tanggal" })
    .click();
  expect((await downloadEvent).suggestedFilename()).toBe(
    "buahaha-sebelum-penyesuaian-tanggal.json",
  );
  const backup = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("buahaha.history.before-september-2026.v1")!,
    ),
  );
  expect(backup).toEqual(seed);
  await page.reload();
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("buahaha.demo.v1")!),
  );
  expect(persisted.orders[0].completedAt).toBe("2026-09-30");
});
