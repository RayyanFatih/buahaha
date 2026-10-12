import { test, expect } from "./fixtures";

test("ready orders appear in shipping, support search, and return when their schedule is deleted", async ({
  page,
}) => {
  await page.goto("/");
  // Use an order without financial dependencies so its schedule may be deleted.
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("buahaha.data.v2")!);
    state.payments = state.payments.filter((p: { orderId: string }) => p.orderId !== "PSN-1004");
    localStorage.setItem("buahaha.data.v2", JSON.stringify(state));
  });
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Pengiriman", exact: true })
    .click();
  const queue = page.getByRole("region", { name: "Pesanan siap dikirim" });
  await expect(
    queue.getByRole("button", { name: /^Jadwalkan PSN/ }),
  ).toHaveCount(1);
  await expect(queue).toContainText("PSN-1004");
  const search = page.getByLabel("Cari pengiriman");
  for (const query of ["PSN-1004", "Dapur Ibu Rani", "Kemang"]) {
    await search.fill(query);
    await expect(
      queue.getByRole("button", { name: "Jadwalkan PSN-1004" }),
    ).toBeVisible();
  }
  await search.fill("tidak ditemukan");
  await expect(queue).toContainText(
    "Tidak ada pesanan siap dikirim yang cocok",
  );
  await search.fill("");
  await page.screenshot({
    path: ".impeccable/review/shipping-queue-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/shipping-queue-mobile.png",
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await queue.getByRole("button", { name: "Jadwalkan PSN-1004" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Petugas pengiriman").fill("Petugas Antrean");
  await dialog.getByLabel("Kendaraan / nomor polisi").fill("B 4567 UJI");
  await dialog.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(queue).toContainText(
    "Belum ada pesanan yang menunggu penjadwalan",
  );
  const trip = page.locator(".trip").filter({ hasText: "Petugas Antrean" });
  await trip.getByRole("button", { name: /^Hapus JLN-/ }).click();
  await dialog.getByRole("button", { name: "Ya, hapus", exact: true }).click();
  await expect(
    queue.getByRole("button", { name: "Jadwalkan PSN-1004" }),
  ).toBeVisible();
  await expect(trip).toHaveCount(0);
});

test("shipping search keeps selections visible and excludes unavailable orders", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Pengiriman", exact: true })
    .click();
  await page.getByLabel("Cari pengiriman").fill("PSN-1003");
  await expect(page.locator(".trip")).toHaveCount(1);
  await page.getByLabel("Cari pengiriman").fill("Hotel Taman Kota");
  await expect(page.locator(".trip")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Jadwalkan pengiriman", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("summary").click();
  const search = dialog.getByLabel("Cari pesanan siap kirim");
  await search.fill("PSN-1003");
  await expect(
    dialog.getByText("Tidak ada pesanan yang cocok.", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Simpan", exact: true }),
  ).toBeDisabled();
  await search.fill("Dapur Ibu Rani");
  await dialog.getByRole("checkbox").check();
  await search.fill("tidak ditemukan");
  await expect(dialog.locator(".shipping-selection")).toContainText("PSN-1004");
  await dialog.locator("summary").click();
  await expect(dialog.locator(".shipping-selection")).toContainText(
    "Dapur Ibu Rani",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/shipping-picker-mobile.png",
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Hapus pilihan PSN-1004" }).click();
  await expect(
    dialog.getByRole("button", { name: "Simpan", exact: true }),
  ).toBeDisabled();
});
