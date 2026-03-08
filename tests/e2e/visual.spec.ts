import { expect, test } from "@playwright/test";

test("terrain overview remains legible", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Huntsville Terrain Explorer" })
  ).toBeVisible();
  await expect(page).toHaveScreenshot("huntsville-terrain-overview.png");
});
