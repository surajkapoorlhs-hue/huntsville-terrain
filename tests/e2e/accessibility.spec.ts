import { expect, test } from "@playwright/test";

test("reduced motion disables UI transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const duration = await page
    .locator(".toggle-row button")
    .first()
    .evaluate((element) => getComputedStyle(element).transitionDuration);

  expect(duration).toBe("0s");
});

test("map surface exposes visible keyboard focus treatment", async ({ page }) => {
  await page.goto("/");

  const mapSurface = page.getByTestId("terrain-map");
  await mapSurface.focus();

  await expect(mapSurface).toHaveAttribute("tabindex", "0");

  const boxShadow = await page
    .locator(".map-shell")
    .evaluate((element) => getComputedStyle(element).boxShadow);

  expect(boxShadow).not.toBe("none");
});
