import { test, expect, type Locator, type Page } from "@playwright/test";
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
const panel = (page: Page) =>
  page.getByRole("dialog", { name: "左上配置", exact: true });
test.describe("classic scrollbars", () => {
  test("viewport scrollbars are excluded from dragging, resizing, maximizing and dynamic bounds", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: `
    html { overflow: scroll !important; }
    ::-webkit-scrollbar { width: 24px; height: 20px; }
  `,
    });
    const viewport = () =>
      page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      }));
    const size = await viewport();
    expect(size.width).toBeLessThan(1100);
    expect(size.height).toBeLessThan(800);
    await page.getByTestId("trigger-0").click();
    const p = panel(page);
    await drag(page, p.locator(".draggable-popup__title"), 2000, 2000);
    await expect
      .poll(async () => {
        const r = await box(p);
        return Math.round(r.x + r.width);
      })
      .toBe(size.width - 8);
    await expect
      .poll(async () => {
        const r = await box(p);
        return Math.round(r.y + r.height);
      })
      .toBe(size.height - 8);
    await drag(page, p.locator(".draggable-popup__title"), -200, -100);
    await drag(page, p.locator('[data-handle="br"]'), 2000, 2000);
    let r = await box(p);
    expect(r.x + r.width).toBeLessThanOrEqual(size.width - 7.5);
    expect(r.y + r.height).toBeLessThanOrEqual(size.height - 7.5);
    expect(Math.round(r.x + r.width)).toBe(size.width - 8);
    expect(Math.round(r.y + r.height)).toBe(size.height - 8);
    await p.getByRole("button", { name: "放大面板", exact: true }).click();
    await expect.poll(async () => (await box(p)).width).toBe(size.width - 16);
    await expect.poll(async () => (await box(p)).height).toBe(size.height - 16);
    // Root scrollbar changes don't necessarily dispatch window.resize.
    await page.addStyleTag({
      content: "html { overflow: hidden !important; }",
    });
    await expect.poll(async () => (await box(p)).width).toBe(1100 - 16);
    await expect.poll(async () => (await box(p)).height).toBe(800 - 16);
    await page.addStyleTag({
      content: "html { overflow: scroll !important; }",
    });
    await expect.poll(async () => (await box(p)).width).toBe(size.width - 16);
    await p.getByRole("button", { name: "还原面板", exact: true }).click();
    r = await box(p);
    expect(r.x + r.width).toBeLessThanOrEqual(size.width - 7.5);
    expect(r.y + r.height).toBeLessThanOrEqual(size.height - 7.5);
  });
});
async function box(el: Locator) {
  return el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}
async function drag(page: Page, el: Locator, dx: number, dy: number) {
  // Wait until an entering drawer reveals this handle and it can receive input.
  await el.hover();
  const b = await el.boundingBox();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2 + dx, b!.y + b!.height / 2 + dy, {
    steps: 10,
  });
  await page.mouse.up();
}
