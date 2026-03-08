# Huntsville Relief And Reliability Pass Implementation Plan

> **Execution:** Use `executing-plans` to implement this plan task-by-task.

**Goal:** Make relief mode visibly stronger, improve map status reliability, and close the remaining usability/accessibility gaps identified in review.

**Architecture:** Keep the current MapLibre runtime, but extract clearer relief-profile settings, apply stronger boosted styling at runtime, and decouple status handling from transient source errors. Add small UI/accessibility refinements without changing the overall app structure.

**Tech Stack:** React 19, Vite, TypeScript, MapLibre GL JS, Zustand, Vitest, Playwright

---

## Tasks

- [ ] 1) Add explicit default/boosted relief profiles and test that boosted mode materially diverges from default.
- [ ] 2) Apply the stronger profile at runtime, including a more muted basemap in boosted mode.
- [ ] 3) Make status badges recover from transient errors and hide steady-state clutter when relief mode is off.
- [ ] 4) Add reduced-motion handling for fly-to and CSS transitions.
- [ ] 5) Add visible keyboard focus treatment for the map surface and improve attribution link distinguishability.
- [ ] 6) Update browser tests to cover relief toggle behavior and rerun full verification.
