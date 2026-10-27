import { test, expect, type Locator, type Page } from "@playwright/test";
const errors = new WeakMap<Page, string[]>();
async function box(el: Locator) {
  return el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}
async function within(el: Locator, page: Page) {
  await expect
    .poll(async () => {
      const r = await box(el),
        v = page.viewportSize()!;
      return (
        r.x >= 7.5 &&
        r.y >= 7.5 &&
        r.x + r.width <= v.width - 7.5 &&
        r.y + r.height <= v.height - 7.5
      );
    })
    .toBe(true);
}
async function drag(page: Page, el: Locator, dx: number, dy: number) {
  const b = await el.boundingBox();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2 + dx, b!.y + b!.height / 2 + dy, {
    steps: 10,
  });
  await page.mouse.up();
}
const panel = (page: Page, i = 0) =>
  page.getByRole("dialog").filter({
    has: page.getByText(
      `${["左上", "右上", "左下", "右下", "滚动容器"][i]}配置`,
      { exact: true },
    ),
  });
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.get(page)!.push(message.text());
  });
  await page.goto("/");
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
test("AC01 AC15: all corners remain visible and escape clipping", async ({
  page,
}) => {
  for (let i = 0; i < 5; i++) {
    await page.getByTestId(`trigger-${i}`).click();
    await within(panel(page, i), page);
    expect(
      await panel(page, i).evaluate((el) => el.parentElement === document.body),
    ).toBe(true);
    await panel(page, i).getByRole("button", { name: "关闭面板" }).click();
  }
});
test("AC02 AC03 AC04 AC09: scroll following, continuous detach, reset", async ({
  page,
}) => {
  await page.getByTestId("trigger-4").click();
  const p = panel(page, 4);
  await within(p, page);
  const before = await box(p);
  await page.locator(".scroll-container").evaluate((el) => (el.scrollTop = 50));
  await expect
    .poll(async () => Math.round((await box(p)).y))
    .toBe(Math.round(before.y - 50));
  const old = await box(p);
  await drag(page, p.locator("header .draggable-popup__title"), 100, 0);
  await expect(p).toHaveAttribute("data-mode", "detached");
  expect((await box(p)).x - old.x).toBeCloseTo(100, 0);
  const fixed = await box(p);
  await page.evaluate(() => window.scrollTo(0, 100));
  await expect.poll(() => box(p)).toEqual(fixed);
  await p.getByRole("button", { name: "复位位置" }).click();
  await expect(p).toHaveAttribute("data-mode", "anchored");
  await within(p, page);
});
test("AC05 AC07 AC08 AC10 AC17: bounds, size retention and small viewport", async ({
  page,
}) => {
  await page.getByTestId("trigger-0").click();
  const p = panel(page);
  for (const [dx, dy] of [
    [-2000, 0],
    [2000, 0],
    [0, -2000],
    [0, 2000],
  ]) {
    await drag(page, p.locator(".draggable-popup__title"), dx!, dy!);
    await within(p, page);
  }
  await p.getByRole("button", { name: "复位位置" }).click();
  await within(p, page);
  await drag(page, p.locator('[data-handle="br"]'), 100, 80);
  const resized = await box(p);
  await p.getByRole("button", { name: "关闭面板" }).click();
  await page.getByTestId("trigger-0").click();
  await expect(p).toHaveAttribute("data-mode", "anchored");
  expect((await box(p)).width).toBe(resized.width);
  await page.setViewportSize({ width: 320, height: 568 });
  await within(p, page);
  await expect(p.getByRole("button", { name: "关闭面板" })).toBeVisible();
  await page.setViewportSize({ width: 220, height: 150 });
  await within(p, page);
});
test("AC06: every handle changes the expected edge without a jump", async ({
  page,
}) => {
  await page.getByTestId("trigger-4").click();
  const p = panel(page, 4);
  await within(p, page);
  for (const h of ["tl", "tm", "tr", "mr", "br", "bm", "bl", "ml"]) {
    const before = await box(p);
    await drag(page, p.locator(`[data-handle="${h}"]`), 12, 12);
    const after = await box(p);
    await expect(p).toHaveAttribute("data-mode", "detached");
    await within(p, page);
    if (h.includes("l")) {
      expect(after.x - before.x).toBeCloseTo(12, 0);
      expect(after.x + after.width).toBeCloseTo(before.x + before.width, 0);
    }
    if (h.startsWith("t")) {
      expect(after.y - before.y).toBeCloseTo(12, 0);
      expect(after.y + after.height).toBeCloseTo(before.y + before.height, 0);
    }
    if (h.includes("r")) expect(after.width - before.width).toBeCloseTo(12, 0);
    if (h.startsWith("b"))
      expect(after.height - before.height).toBeCloseTo(12, 0);
  }
});
test("AC11: Ant form input, select portal, date picker and body scrolling", async ({
  page,
}) => {
  await page.getByTestId("outside").check();
  await page.getByTestId("trigger-0").click();
  const p = panel(page);
  await p.getByPlaceholder("可正常输入与选字").fill("persistent text");
  await p.locator(".ant-select-selector").click();
  await page.getByTitle("Writing", { exact: true }).click();
  await expect(p).toBeVisible();
  await expect(p).toHaveAttribute("data-mode", "anchored");
  await expect(p.getByPlaceholder("可正常输入与选字")).toHaveValue(
    "persistent text",
  );
  await p.locator(".ant-picker input").click();
  await expect(p.locator(".ant-picker-dropdown")).toBeVisible();
  await page.screenshot({ path: "docs/demo.png", animations: "disabled" });
  await p.locator("textarea").fill("prompt text");
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(p.locator("textarea")).toBeFocused();
  await expect(p.locator("textarea")).toHaveValue("prompt text");
  await p
    .locator(".draggable-popup__body")
    .evaluate((el) => (el.scrollTop = 500));
  expect(
    await p.locator(".draggable-popup__body").evaluate((el) => el.scrollTop),
  ).toBeGreaterThan(0);
  await expect(p.getByRole("button", { name: "关闭面板" })).toBeVisible();
  await p.locator("p").last().dblclick();
  expect(
    await page.evaluate(() => window.getSelection()?.toString().length),
  ).toBeGreaterThan(0);
  await expect(p).toHaveAttribute("data-mode", "anchored");
});
test("AC12 AC13 AC14: isolation, external control, twenty cycles without errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.getByRole("button", { name: "同时打开两个" }).click();
  const a = panel(page),
    b = panel(page, 1);
  await within(a, page);
  await within(b, page);
  const before = await box(b);
  await drag(page, a.locator(".draggable-popup__title"), 80, 100);
  expect(await box(b)).toEqual(before);
  expect(
    await a.evaluate((e) => Number((e as HTMLElement).style.zIndex)),
  ).toBeGreaterThan(
    await b.evaluate((e) => Number((e as HTMLElement).style.zIndex)),
  );
  await page.getByTestId("external-close").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (let i = 0; i < 20; i++) {
    await page.getByTestId("trigger-0").click();
    await panel(page).getByRole("button", { name: "关闭面板" }).click();
  }
  expect(errors).toEqual([]);
});
test("AC16: keyboard activation, escape and focus restoration", async ({
  page,
}) => {
  const trigger = page.getByTestId("trigger-0");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Space");
  await expect(panel(page)).toBeVisible();
  await panel(page).getByRole("button", { name: "复位位置" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    panel(page).getByRole("button", { name: "关闭面板" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toBeFocused();
});
test("AC18: removed anchors close anchored but retain detached panels", async ({
  page,
}) => {
  await page.getByTestId("trigger-0").click();
  await within(panel(page), page);
  await page
    .getByTestId("trigger-0")
    .evaluate((e) => e.parentElement!.remove());
  await expect(panel(page)).toHaveCount(0);
  await page.getByTestId("trigger-1").click();
  const p = panel(page, 1);
  await drag(page, p.locator(".draggable-popup__title"), -100, 100);
  await page.getByLabel("显示锚点", { exact: true }).uncheck();
  await expect(p).toBeVisible();
  await p.getByRole("button", { name: "关闭面板" }).click();
});
test("resize extremes, disabled interactions, outside close and pointercancel", async ({
  page,
}) => {
  await page.getByTestId("trigger-0").click();
  const p = panel(page);
  await within(p, page);
  await drag(page, p.locator('[data-handle="br"]'), -2000, -2000);
  let r = await box(p);
  expect(r.width).toBe(260);
  expect(r.height).toBe(180);
  await drag(page, p.locator('[data-handle="br"]'), 2000, 2000);
  r = await box(p);
  expect(r.width).toBe(960);
  expect(r.height).toBeLessThanOrEqual(800);
  await within(p, page);
  const title = p.locator(".draggable-popup__title");
  const b = await title.boundingBox();
  await page.mouse.move(b!.x + 10, b!.y + 10);
  await page.mouse.down();
  await p.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  const before = await box(p);
  await page.mouse.move(500, 500);
  expect(await box(p)).toEqual(before);
  await p.getByRole("button", { name: "关闭面板" }).click();
  await page.getByLabel("拖动", { exact: true }).uncheck();
  await page.getByLabel("缩放", { exact: true }).uncheck();
  await page.getByTestId("outside").check();
  await page.getByTestId("trigger-0").click();
  await expect(p.locator("[data-handle]")).toHaveCount(0);
  const old = await box(p);
  await drag(page, p.locator(".draggable-popup__title"), 50, 50);
  expect(await box(p)).toEqual(old);
  await expect(p).toHaveAttribute("data-mode", "anchored");
  await page.locator("h1").click();
  await expect(p).toHaveCount(0);
});
