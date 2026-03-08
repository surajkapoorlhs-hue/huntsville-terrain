import { expect, test } from "@playwright/test";

test("mobile layout keeps the map primary and uses a floating control dock", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".control-panel")).toHaveCount(0);
  await expect(page.locator(".control-dock")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const map = document.querySelector(".map-shell")?.getBoundingClientRect();
    const dock = document.querySelector(".control-dock")?.getBoundingClientRect();
    return {
      mapTop: map?.top ?? 0,
      dockTop: dock?.top ?? 0,
      dockHeight: dock?.height ?? 0
    };
  });

  expect(metrics.mapTop).toBeLessThanOrEqual(12);
  expect(metrics.dockTop).toBeGreaterThanOrEqual(metrics.mapTop);
  expect(metrics.dockHeight).toBeLessThan(540);
});

test("collapsed dock stays compact on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Collapse controls" }).click();

  const metrics = await page.evaluate(() => {
    const dock = document.querySelector(".control-dock")?.getBoundingClientRect();
    return {
      dockHeight: dock?.height ?? 0
    };
  });

  expect(metrics.dockHeight).toBeLessThan(180);
});
