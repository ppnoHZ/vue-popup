import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { cpus, platform } from "node:os";
import process from "node:process";

const { values } = parseArgs({
  options: {
    url: {
      type: "string",
      default: "http://127.0.0.1:5187/examples/draggable-popup",
    },
    out: { type: "string", default: "test-results/performance.json" },
    label: { type: "string", default: "current" },
    cpu: { type: "string", default: "4" },
    repeat: { type: "string", default: "2" },
  },
});
const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
  headless: true,
});
const results = [];
const quantile = (array, q) => {
  const sorted = [...array].sort((a, b) => a - b);
  return (
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0
  );
};
const round = (n) => Math.round(n * 100) / 100;
try {
  for (const variant of ["popup", "modal", "drawer"])
    for (const action of ["drag", "resize"])
      for (let repeat = 0; repeat < Number(values.repeat); repeat++) {
        results.push(await measure(variant, action, false, repeat));
      }
  for (const action of ["drag", "resize"])
    results.push(await measure("popup", action, true, 0));
  const report = {
    label: values.label,
    environment: {
      browser: browser.version(),
      platform: platform(),
      cpu: cpus()[0]?.model,
      logicalCores: cpus().length,
      cpuThrottle: Number(values.cpu),
      viewport: "1100x800",
      mode: "Vite development demo; reduced motion; real mouse + separately labelled synthetic 960Hz stress",
    },
    results,
  };
  mkdirSync(dirname(values.out), { recursive: true });
  writeFileSync(values.out, JSON.stringify(report, null, 2) + "\n");
  console.log(`Report written to ${values.out}`);
} finally {
  await browser.close();
}

async function measure(variant, action, burst, repeat) {
  const page = await browser.newPage({
      viewport: { width: 1100, height: 800 },
    }),
    client = await page.context().newCDPSession(page);
  try {
    await client.send("Emulation.setCPUThrottlingRate", {
      rate: Number(values.cpu),
    });
    await client.send("Performance.enable");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(values.url);
    const trigger = {
      popup: "trigger-0",
      modal: "migration-modal-trigger",
      drawer: "drawer-trigger",
    }[variant];
    await page.getByTestId(trigger).click();
    const panel = page.getByRole("dialog", {
      name: { popup: "左上配置", modal: "Antdv Modal API", drawer: "右侧抽屉" }[
        variant
      ],
    });
    const target = panel.locator(
      action === "drag"
        ? ".draggable-popup__title"
        : `[data-handle="${variant === "drawer" ? "bl" : "br"}"]`,
    );
    await target.hover();
    const box = await target.boundingBox();
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const dx = variant === "drawer" ? -80 : 80,
      dy = action === "resize" ? 60 : 30;
    await panel.evaluate((el) => {
      const state = {
        frames: [],
        longTasks: [],
        coreUpdates: 0,
        parentUpdates: 0,
        diagnosticUpdates: 0,
        active: true,
        last: 0,
        raf: 0,
      };
      window.__interactionBench = state;
      for (const [instance, key] of [
        [el.__vueParentComponent, "coreUpdates"],
        [document.querySelector("#app").__vue_app__._instance, "parentUpdates"],
        [
          document.querySelector(".inspector").__vueParentComponent,
          "diagnosticUpdates",
        ],
      ])
        instance.u = [
          ...(instance.u || []),
          () => {
            if (state.active) state[key]++;
          },
        ];
      state.observer = new PerformanceObserver((list) => {
        if (state.active)
          state.longTasks.push(
            ...list.getEntries().map((entry) => entry.duration),
          );
      });
      state.observer.observe({ type: "longtask" });
      const frame = (now) => {
        if (!state.active) return;
        if (state.last) state.frames.push(now - state.last);
        state.last = now;
        state.raf = requestAnimationFrame(frame);
      };
      state.raf = requestAnimationFrame(frame);
    });
    const before = Object.fromEntries(
      (await client.send("Performance.getMetrics")).metrics.map((x) => [
        x.name,
        x.value,
      ]),
    );
    const started = performance.now();
    if (burst) {
      await target.evaluate(
        async (el, { point, dx, dy }) => {
          const event = (type, x, y) =>
            el.dispatchEvent(
              new PointerEvent(type, {
                bubbles: true,
                button: 0,
                pointerId: 77,
                clientX: x,
                clientY: y,
              }),
            );
          event("pointerdown", point.x, point.y);
          for (let frame = 0; frame < 60; frame++) {
            await new Promise(requestAnimationFrame);
            for (let sample = 0; sample < 16; sample++) {
              const phase = ((frame * 16 + sample) % 120) / 119,
                amount = phase < 0.5 ? phase * 2 : 2 - phase * 2;
              window.dispatchEvent(
                new PointerEvent("pointermove", {
                  pointerId: 77,
                  clientX: point.x + dx * amount,
                  clientY: point.y + dy * amount,
                }),
              );
              await Promise.resolve();
            }
          }
          window.dispatchEvent(
            new PointerEvent("pointerup", { pointerId: 77 }),
          );
        },
        { point, dx, dy },
      );
    } else {
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      await page.mouse.move(point.x + dx, point.y + dy, { steps: 60 });
      await page.mouse.move(point.x, point.y, { steps: 60 });
      await page.mouse.up();
    }
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const after = Object.fromEntries(
      (await client.send("Performance.getMetrics")).metrics.map((x) => [
        x.name,
        x.value,
      ]),
    );
    const counters = await page.evaluate(() => {
      const s = window.__interactionBench;
      s.active = false;
      cancelAnimationFrame(s.raf);
      s.observer.disconnect();
      return {
        frames: s.frames,
        longTasks: s.longTasks,
        coreUpdates: s.coreUpdates,
        parentUpdates: s.parentUpdates,
        diagnosticUpdates: s.diagnosticUpdates,
      };
    });
    const result = {
      variant,
      action,
      load: burst ? "synthetic-16-samples-per-frame" : "real-mouse-120-samples",
      repeat,
      wallMs: round(performance.now() - started),
      scriptMs: round((after.ScriptDuration - before.ScriptDuration) * 1000),
      layoutMs: round((after.LayoutDuration - before.LayoutDuration) * 1000),
      taskMs: round((after.TaskDuration - before.TaskDuration) * 1000),
      frameP95Ms: round(quantile(counters.frames, 0.95)),
      slowFrames: counters.frames.filter((x) => x > 33.4).length,
      longTasks: counters.longTasks.length,
      longTaskMs: round(counters.longTasks.reduce((a, b) => a + b, 0)),
      coreUpdates: counters.coreUpdates,
      parentUpdates: counters.parentUpdates,
      diagnosticUpdates: counters.diagnosticUpdates,
      inputSamples: burst ? 960 : 120,
    };
    console.log(JSON.stringify(result));
    return result;
  } finally {
    await page.close();
  }
}
