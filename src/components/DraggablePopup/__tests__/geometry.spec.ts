import { describe, expect, it } from "vitest";
import {
  constrain,
  resizeRect,
  viewportRect,
  dockRight,
} from "../composables/geometry";
import type { ResizeHandle } from "../types";
const limits = {
  minWidth: 260,
  minHeight: 180,
  maxWidth: 960,
  maxHeight: 800,
  boundaryPadding: 8,
};
describe("viewport geometry", () => {
  it("docks at the right boundary and uses available height within configured limits", () => {
    expect(
      dockRight({ x: 0, y: 0, width: 420, height: 300 }, limits, 1100, 800),
    ).toEqual({ x: 672, y: 8, width: 420, height: 784 });
    expect(
      dockRight({ x: 0, y: 0, width: 420, height: 300 }, limits, 220, 150),
    ).toEqual({ x: 8, y: 8, width: 204, height: 134 });
  });
  it("maximized geometry fills the viewport and remains nonnegative on tiny screens", () => {
    expect(viewportRect(8, 1100, 800)).toEqual({
      x: 8,
      y: 8,
      width: 1084,
      height: 784,
    });
    expect(viewportRect(8, 0, 0)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
  it("clamps dimensions and coordinates, including tiny viewports", () => {
    for (const [vw, vh] of [
      [1100, 800],
      [320, 568],
      [100, 100],
      [1, 1],
      [0, 0],
    ]) {
      const r = constrain(
        { x: -100, y: 2000, width: 2000, height: -2 },
        limits,
        vw!,
        vh!,
      );
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(vw!);
      expect(r.y + r.height).toBeLessThanOrEqual(vh!);
      expect(r.width).toBeGreaterThanOrEqual(0);
      expect(r.height).toBeGreaterThanOrEqual(0);
    }
  });
  it.each<ResizeHandle>(["tl", "tm", "tr", "mr", "br", "bm", "bl", "ml"])(
    "%s keeps opposite edges fixed and clamps extremes",
    (h) => {
      const r = { x: 200, y: 200, width: 360, height: 280 };
      for (const d of [-2000, -20, 20, 2000]) {
        const next = resizeRect(r, h, d, d, limits, 1100, 800);
        expect(next.width).toBeGreaterThanOrEqual(260);
        expect(next.height).toBeGreaterThanOrEqual(180);
        expect(next.x).toBeGreaterThanOrEqual(8);
        expect(next.y).toBeGreaterThanOrEqual(8);
        expect(next.x + next.width).toBeLessThanOrEqual(1092);
        expect(next.y + next.height).toBeLessThanOrEqual(792);
        if (h.includes("l")) expect(next.x + next.width).toBe(r.x + r.width);
        if (h.startsWith("t"))
          expect(next.y + next.height).toBe(r.y + r.height);
      }
    },
  );
  it("normalizes invalid geometry", () =>
    expect(
      constrain(
        { x: NaN, y: Infinity, width: NaN, height: 0 },
        limits,
        320,
        568,
      ),
    ).toEqual({ x: 8, y: 8, width: 260, height: 180 }));
});
