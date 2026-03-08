import { expect, test } from "@playwright/test";

test("terrain opens as the default mode and exposes the terrain controls", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByText("Map mode", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reference" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Terrain" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Topo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Relief Model" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Terrain" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByText("Reference style")).toHaveCount(0);
  await expect(page.getByText("Overlays", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Streams" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preserves/Parks" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Curated Sites" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trails" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Relief boost" })).toHaveCount(0);
  await expect(page).toHaveURL(/mode=terrain/);
  await expect(page.getByRole("status")).toContainText("Terrain mode");
  await page.waitForTimeout(1000);
  await expect(page.getByText("Map data issue detected")).toHaveCount(0);
});

test("clicking a curated site opens the info card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Monte Sano State Park" }).click();

  await expect(
    page.getByRole("heading", { name: "Monte Sano State Park" })
  ).toBeVisible();
  await expect(
    page.getByText(/signature ridge-top park east of downtown/i)
  ).toBeVisible();
  await expect(page).toHaveURL(/site=monte-sano-state-park/);
});

test("opening a shared site url restores selection", async ({ page }) => {
  await page.goto("/?site=blevins-gap");

  await expect(page.getByRole("heading", { name: "Blevins Gap" })).toBeVisible();
  await expect(page).toHaveURL(/site=blevins-gap/);
});

test("terrain mode updates the explorer mode state", async ({ page }) => {
  await page.goto("/?mode=reference");
  const terrainButton = page.getByRole("button", { name: "Terrain" });

  await terrainButton.click();

  await expect(terrainButton).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/mode=terrain/);
  await expect(page.getByText("Reference style")).toHaveCount(0);
});

test("natural paper reference style updates the reference state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reference" }).click();
  const naturalPaperButton = page.getByRole("button", { name: "Natural Paper" });

  await naturalPaperButton.click();

  await expect(naturalPaperButton).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/refStyle=natural-paper/);
});

test("overlay toggles update their pressed state", async ({ page }) => {
  await page.goto("/");
  const trailsButton = page.getByRole("button", { name: "Trails" });

  await expect(trailsButton).toHaveAttribute("aria-pressed", "false");
  await trailsButton.click();
  await expect(trailsButton).toHaveAttribute("aria-pressed", "true");
});

test("practical places open with distinct curated details", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Huntsville Hospital" }).click();

  await expect(
    page.getByRole("heading", { name: "Huntsville Hospital" })
  ).toBeVisible();
  await expect(page.getByText(/medical district/i)).toBeVisible();
  await expect(page).toHaveURL(/site=huntsville-hospital/);
});

test("adding a candidate home saves it locally and restores it after reload", async ({
  page
}) => {
  await page.route("https://nominatim.openstreetmap.org/search*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          lat: "34.7132100",
          lon: "-86.6014500",
          display_name:
            "250 Example Lane, Huntsville, Madison County, Alabama, 35801, United States"
        }
      ])
    });
  });

  await page.goto("/");
  await page.getByLabel("Address to consider").fill("250 Example Lane, Huntsville, AL");
  await page.getByRole("button", { name: "Add home" }).click();

  await expect(page.getByRole("heading", { name: "250 Example Lane" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove 250 Example Lane" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("button", { name: "Remove 250 Example Lane" })).toBeVisible();
});

test("the control dock can collapse and expand", async ({ page }) => {
  await page.goto("/");

  const collapseButton = page.getByRole("button", { name: "Collapse controls" });
  await collapseButton.click();

  await expect(page.locator(".control-dock")).toHaveClass(/is-collapsed/);
  await expect(page.getByText("Overlays", { exact: true })).toHaveCount(0);

  const expandButton = page.getByRole("button", { name: "Expand controls" });
  await expandButton.click();

  await expect(page.locator(".control-dock")).not.toHaveClass(/is-collapsed/);
  await expect(page.getByText("Overlays", { exact: true })).toBeVisible();
});
