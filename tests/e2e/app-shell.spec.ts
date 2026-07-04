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

test("opens context menu and shortcut help", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.locator('[data-node-name="Hero headline"]').click({ button: "right" });
  await expect(page.getByTestId("context-menu")).toBeVisible();
  await page.getByText("Bring forward").click();

  await page.getByTestId("svg-canvas").focus();
  await page.keyboard.press("?");
  await expect(page.getByTestId("shortcut-help")).toBeVisible();
});

test("edits and detaches component instances", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: "Assets" }).click();
  await page.getByRole("button", { name: "Insert Primary Button instance" }).click();
  await expect(page.locator('[data-node-name="Primary Button instance"]')).toBeVisible();

  await page.locator('[data-node-name="Secondary CTA instance"]').click();
  await page.getByLabel("Instance text override").fill("Open replay");
  await expect(page.getByText("Open replay")).toBeVisible();

  await page.getByRole("button", { name: "Detach" }).click();
  await expect(page.locator('[data-node-kind="ComponentInstance"][data-node-name="Secondary CTA instance"]')).toHaveCount(0);
  await expect(page.getByText("Open replay")).toBeVisible();
});

test("shows snapping guides while dragging a selected layer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.getByTestId("snap-controls")).toBeVisible();
  await page.getByRole("button", { name: "Grid snapping" }).click();
  const body = page.locator('[data-node-name="Hero supporting copy"]');
  const box = await body.boundingBox();
  if (!box) {
    throw new Error("Missing body copy bounds");
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 2, box.y + box.height / 2, { steps: 5 });
  expect(await page.getByTestId("snapping-guide").count()).toBeGreaterThan(0);
  await page.mouse.up();

  await expect(page.getByTestId("selection-outline")).toHaveAttribute("x", "160");
});

test("creates, replies to, resolves, and jumps to a comment pin", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.getByTestId("comments-panel")).toBeVisible();
  await page.getByRole("button", { name: "Comment" }).click();
  await page.getByTestId("scene-svg").click({ position: { x: 620, y: 320 } });

  await expect(page.getByTestId("comment-pin")).toHaveCount(1);
  await expect(page.getByTestId("comments-panel")).toContainText("Review this area");

  await page.getByLabel("Reply to comment 1").fill("Looks good");
  await page.getByLabel("Reply to comment 1").press("Enter");
  await expect(page.getByTestId("comments-panel")).toContainText("Looks good");

  await page.getByLabel("Resolve comment 1").click();
  await expect(page.getByTestId("comments-panel")).toContainText("Resolved");
  await page.getByLabel("Jump to comment 1").click();
  await expect(page.locator("[data-comment-card-id]").first()).toHaveClass(/border-pink-400/);
});
