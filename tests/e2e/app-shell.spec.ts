import { expect, test } from "@playwright/test";

test("loads the professional workspace shell on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(page.getByTestId("top-toolbar")).toBeVisible();
  await expect(page.getByTestId("left-panel")).toBeVisible();
  await expect(page.getByTestId("right-inspector")).toBeVisible();
  await expect(page.getByTestId("canvas-shell")).toBeVisible();
  await expect(page.getByTestId("demo-project-picker")).toBeVisible();
  await expect(page.getByTestId("scene-svg")).toBeVisible();
  await expect(page.locator('[data-node-name="Hero headline"]')).toBeVisible();
});

test("keeps the shell usable on mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(page.getByTestId("top-toolbar")).toBeVisible();
  await expect(page.getByTestId("canvas-shell")).toBeVisible();
  await expect(page.getByTestId("mobile-panel-summary")).toBeVisible();
  await expect(page.getByTestId("scene-svg")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test("selects and nudges a canvas node", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const canvas = page.getByTestId("svg-canvas");
  await page.locator('[data-node-name="Hero headline"]').click();
  await expect(page.getByTestId("selection-outline")).toBeVisible();

  const before = await page.getByTestId("selection-outline").getAttribute("x");
  await canvas.press("ArrowRight");
  const after = await page.getByTestId("selection-outline").getAttribute("x");

  expect(Number(after)).toBe(Number(before) + 1);
});

test("creates a rectangle node from the canvas tools", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: "Create Rectangle" }).click();
  await page.getByTestId("scene-svg").click({ position: { x: 620, y: 360 } });

  await expect(page.locator('[data-node-name="New Rectangle"]')).toBeVisible();
  await expect(page.getByTestId("selection-outline")).toBeVisible();
});

test("filters layers and toggles node visibility", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByPlaceholder("Search layers").fill("headline");
  await expect(page.locator('[data-layer-node-id]').filter({ hasText: "Hero headline" })).toBeVisible();
  await page.getByLabel("Toggle visibility Hero headline").click();
  await expect(page.locator('[data-node-name="Hero headline"]')).toHaveCount(0);
});

test("edits geometry through the inspector", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.locator('[data-node-name="Hero headline"]').click();
  await page.getByLabel("Inspector X").fill("210");

  await expect(page.getByTestId("selection-outline")).toHaveAttribute("x", "210");
});
