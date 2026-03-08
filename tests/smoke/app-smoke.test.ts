import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getAppTitle } from "../../src/App";

describe("app shell", () => {
  it("exposes the Huntsville terrain explorer title", () => {
    expect(getAppTitle()).toBe("Huntsville Terrain Explorer");
  });

  it("includes a meta description for the explorer", () => {
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

    expect(html).toContain('name="description"');
  });
});
