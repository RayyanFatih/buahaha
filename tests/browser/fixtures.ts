import { test as base, expect } from "@playwright/test";
import { demoState } from "../../src/lib/demo";

// Test-only fixtures; the application itself always starts empty.
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.addInitScript((state) => {
      if (!localStorage.getItem("buahaha.data.v2"))
        localStorage.setItem("buahaha.data.v2", JSON.stringify(state));
    }, demoState());
    await runTest(page);
  },
});
export { expect };
export type { Page } from "@playwright/test";
