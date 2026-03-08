# Huntsville First Pass Improvements Implementation Plan

> **Execution:** Use `executing-plans` to implement this plan task-by-task.

**Goal:** Upgrade the terrain explorer from a working prototype into a stronger first-pass product by fixing misleading controls, improving mobile and desktop UX, strengthening terrain readability, adding shareable URL state, and polishing metadata/copy.

**Architecture:** Keep the existing React + MapLibre app, but move to a map-first layout, tighten the overlay model, and centralize explorer state in small pure helpers for URL sync and map mode. Continue using open remote terrain/raster sources for this pass while making failures more visible and the interface more intentional.

**Tech Stack:** React 19, Vite, TypeScript, MapLibre GL JS, Zustand, Vitest, Playwright

---

## Execution Notes

- `huntsville-diorama/` is still not a git repository, so worktree/commit steps remain unavailable.
- This pass intentionally does **not** implement a full local vector/terrain pipeline.
- First-pass scope includes: attribution, mobile map-first layout, better terrain emphasis, URL-sync/shareability, metadata/copy polish, and removal of false affordances.

### Task 1: Make the explorer map-first and remove empty overlays

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/ui/SiteInfoCard.tsx`
- Test: `tests/e2e/layout.spec.ts`

**Step 1: Write the failing browser spec**

```ts
import { expect, test } from "@playwright/test";

test("mobile layout shows the map before the control rail", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const ordering = await page.evaluate(() => {
    const map = document.querySelector(".map-shell")?.getBoundingClientRect().top ?? 0;
    const panel = document.querySelector(".control-panel")?.getBoundingClientRect().top ?? 0;
    return { map, panel };
  });

  expect(ordering.map).toBeLessThanOrEqual(ordering.panel);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`
Expected: FAIL because the control rail renders above the map on mobile.

**Step 3: Write minimal implementation**

- Reorder the app shell so the map is the primary surface in both DOM and layout.
- Remove the always-present empty site card overlay and any redundant “shell online” map card.
- Keep the explanatory copy in the rail instead of floating over the map by default.
- Ensure the selected site card appears only when a site is selected.

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`
Expected: PASS.

**Step 5: Snapshot changes**

Run: `test -d .git && git status --short || echo "git unavailable"`
Expected: `git unavailable`.

### Task 2: Replace the fake contour control with real terrain emphasis and sync explorer state to the URL

**Files:**
- Create: `src/map/urlState.ts`
- Modify: `src/store/mapUiStore.ts`
- Modify: `src/ui/LayerControls.tsx`
- Modify: `src/map/MapView.tsx`
- Modify: `src/map/buildTerrainStyle.ts`
- Test: `tests/unit/url-state.test.ts`
- Modify: `tests/unit/map-ui-store.test.ts`
- Modify: `tests/e2e/controls.spec.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { parseUrlState, stringifyUrlState } from "../../src/map/urlState";

describe("map url state", () => {
  it("round-trips selected site and camera params", () => {
    const url = stringifyUrlState({
      siteId: "monte-sano-state-park",
      camera: { lng: -86.53, lat: 34.74, zoom: 12.4, pitch: 58, bearing: 22 }
    });
    expect(parseUrlState(url).siteId).toBe("monte-sano-state-park");
  });
});
```

```ts
describe("map ui store", () => {
  it("tracks relief boost mode", () => {
    const store = createMapUiStore();
    store.getState().toggleReliefBoost();
    expect(store.getState().reliefBoost).toBe(true);
  });
});
```

```ts
test("selecting a site updates the shareable URL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Monte Sano State Park" }).click();
  await expect(page).toHaveURL(/site=monte-sano-state-park/);
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/url-state.test.ts tests/unit/map-ui-store.test.ts`
Expected: FAIL because URL helpers and relief-boost state do not exist.

Run: `npm run test:e2e -- tests/e2e/controls.spec.ts`
Expected: FAIL because site selection does not update the URL yet.

**Step 3: Write minimal implementation**

- Remove the contour concept from the UI and store.
- Add a real `Relief boost` toggle that increases terrain exaggeration and hillshade emphasis.
- Add pure URL-state helpers that parse and serialize selected site plus camera state.
- Keep the URL in sync on site selection and `moveend`.
- Hydrate initial site/camera state from the URL on load.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/url-state.test.ts tests/unit/map-ui-store.test.ts`
Expected: PASS.

Run: `npm run test:e2e -- tests/e2e/controls.spec.ts`
Expected: PASS.

**Step 5: Snapshot changes**

Run: `test -d .git && git status --short || echo "git unavailable"`
Expected: `git unavailable`.

### Task 3: Add loading/error transparency, attribution, and stronger terrain styling

**Files:**
- Modify: `src/map/MapView.tsx`
- Modify: `src/map/buildTerrainStyle.ts`
- Modify: `src/styles.css`
- Test: `tests/unit/build-terrain-style.test.ts`
- Test: `tests/e2e/map-shell.spec.ts`

**Step 1: Write the failing tests**

```ts
it("keeps attribution enabled and relief styling pronounced", () => {
  const style = buildTerrainStyle();
  const hillshade = style.layers.find((layer) => layer.id === "terrain-hillshade");
  expect(style.sources.basemap.attribution).toContain("OpenStreetMap");
  expect(hillshade?.type).toBe("hillshade");
});
```

```ts
test("map shell communicates loading or source status", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/terrain|loading|open map data/i)).toBeVisible();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/build-terrain-style.test.ts`
Expected: FAIL if the style assertions are missing.

Run: `npm run test:e2e -- tests/e2e/map-shell.spec.ts`
Expected: FAIL because no explicit map status copy exists.

**Step 3: Write minimal implementation**

- Enable visible attribution control.
- Add a compact status element for loading/ready/error conditions.
- Listen for `load`, `idle`, and `error` to surface source problems without crashing.
- Strengthen the terrain look with higher hillshade emphasis, slightly stronger terrain exaggeration defaults, and cleaner raster treatment.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/build-terrain-style.test.ts`
Expected: PASS.

Run: `npm run test:e2e -- tests/e2e/map-shell.spec.ts`
Expected: PASS.

**Step 5: Snapshot changes**

Run: `test -d .git && git status --short || echo "git unavailable"`
Expected: `git unavailable`.

### Task 4: Polish metadata, copy, and visual coverage

**Files:**
- Modify: `index.html`
- Modify: `src/App.tsx`
- Modify: `tests/smoke/app-smoke.test.ts`
- Modify: `tests/e2e/visual.spec.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("document metadata", () => {
  it("includes a meta description for the explorer", () => {
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    expect(html).toContain('name="description"');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/smoke/app-smoke.test.ts`
Expected: FAIL because the current HTML lacks description/share metadata or old copy assertions need updating.

**Step 3: Write minimal implementation**

- Replace prototype/internal phrasing with public-facing copy.
- Add description + Open Graph + Twitter metadata in `index.html`.
- Refresh the visual baseline if the UI materially changes.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/smoke/app-smoke.test.ts`
Expected: PASS.

Run: `npm run test:e2e -- tests/e2e/visual.spec.ts --update-snapshots`
Expected: PASS with an updated snapshot if needed.

**Step 5: Final verification**

Run: `npm run test`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run build:data`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

Run: `npm run test:e2e`
Expected: PASS.
