import { expect, test } from "@playwright/test";

test("loads the Huntsville terrain map shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Huntsville Terrain Explorer" })
  ).toBeVisible();
  await expect(page.getByTestId("terrain-map")).toBeVisible();
  await expect(page.locator(".control-dock")).toBeVisible();
});
