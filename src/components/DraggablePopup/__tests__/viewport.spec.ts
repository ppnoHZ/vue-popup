import { expect, it, vi } from "vitest";
import { viewportSize } from "../composables/viewport";

it("uses client dimensions excluding both scrollbar axes", () => {
  const width = vi
    .spyOn(document.documentElement, "clientWidth", "get")
    .mockReturnValue(980);
  const height = vi
    .spyOn(document.documentElement, "clientHeight", "get")
    .mockReturnValue(720);
  try {
    expect(viewportSize()).toEqual({ width: 980, height: 720 });
  } finally {
    width.mockRestore();
    height.mockRestore();
  }
});

it("falls back to inner dimensions when the DOM has no layout", () => {
  expect(viewportSize()).toEqual({
    width: window.innerWidth,
    height: window.innerHeight,
  });
});
