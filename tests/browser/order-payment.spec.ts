import { test, expect } from "./fixtures";

for (const method of ["transfer-unpaid", "transfer-paid", "COD"]) {
  test(`order payment ${method} appears in payments without duplicate input`, async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Pesanan", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Buat pesanan", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Pelanggan", { exact: true }).selectOption("c1");
    await dialog
      .getByLabel("Pembayaran pesanan", { exact: true })
      .selectOption(method);
    if (method === "transfer-paid") {
      await dialog.getByLabel("Nominal transfer (Rp)").fill("10000");
      await dialog
        .getByLabel("Bukti transfer (wajib)")
        .setInputFiles({
          name: "transfer.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlSAAAAAASUVORK5CYII=",
            "base64",
          ),
        });
      await expect(
        dialog.getByText("transfer.png", { exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: ".impeccable/review/order-payment-desktop.png",
        animations: "disabled",
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await dialog
        .getByLabel("Pembayaran pesanan", { exact: true })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: ".impeccable/review/order-payment-mobile.png",
        animations: "disabled",
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await dialog.getByRole("button", { name: "Simpan", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Pembayaran", exact: true })
      .click();
    const bill = page
      .locator(".receivables-panel tr")
      .filter({ hasText: "PSN-1007" });
    await expect(bill).toContainText(
      method === "COD" ? "Cash/COD" : "Transfer",
    );
    await expect(bill).toContainText(
      method === "transfer-paid" ? "15.000" : "25.000",
    );
    if (method === "COD")
      await expect(
        bill.getByRole("button", { name: "Catat penerimaan COD" }),
      ).toBeDisabled();
    const receipts = page
      .locator(".payments-table tr")
      .filter({ hasText: "PSN-1007" });
    await expect(receipts).toHaveCount(method === "transfer-paid" ? 1 : 0);
    if (method === "transfer-paid") {
      await expect(receipts).toContainText("10.000");
      await expect(receipts).toContainText("Menunggu");
      await receipts
        .getByRole("button", { name: "Verifikasi", exact: true })
        .click();
      await expect(receipts).toContainText("Terverifikasi");
    }
    await page.reload();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Pembayaran", exact: true })
      .click();
    await expect(bill).toHaveCount(1);
    await expect(receipts).toHaveCount(method === "transfer-paid" ? 1 : 0);
  });
}
