import type { PopupRect, ResizeHandle } from "../types";
export interface Limits {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  boundaryPadding: number;
}
const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(Number.isFinite(v) ? v : min, min), max);
export function bounds(l: Limits, vw: number, vh: number) {
  const p = clamp(l.boundaryPadding, 0, Math.max(0, Math.min(vw, vh) / 2));
  const maxW = Math.max(0, Math.min(l.maxWidth, vw - 2 * p)),
    maxH = Math.max(0, Math.min(l.maxHeight, vh - 2 * p));
  return {
    p,
    maxW,
    maxH,
    minW: clamp(l.minWidth, 0, maxW),
    minH: clamp(l.minHeight, 0, maxH),
  };
}
export function constrain(
  r: PopupRect,
  l: Limits,
  vw: number,
  vh: number,
): PopupRect {
  const b = bounds(l, vw, vh),
    width = clamp(r.width, b.minW, b.maxW),
    height = clamp(r.height, b.minH, b.maxH);
  return {
    width,
    height,
    x: clamp(r.x, b.p, vw - b.p - width),
    y: clamp(r.y, b.p, vh - b.p - height),
  };
}
export function resizeRect(
  r: PopupRect,
  h: ResizeHandle,
  dx: number,
  dy: number,
  l: Limits,
  vw: number,
  vh: number,
): PopupRect {
  const b = bounds(l, vw, vh),
    left = h.includes("l"),
    right = h.includes("r"),
    top = h.startsWith("t"),
    bottom = h.startsWith("b");
  const width = clamp(
    r.width + (left ? -dx : right ? dx : 0),
    b.minW,
    Math.min(
      b.maxW,
      left ? r.x + r.width - b.p : right ? vw - b.p - r.x : b.maxW,
    ),
  );
  const height = clamp(
    r.height + (top ? -dy : bottom ? dy : 0),
    b.minH,
    Math.min(
      b.maxH,
      top ? r.y + r.height - b.p : bottom ? vh - b.p - r.y : b.maxH,
    ),
  );
  return {
    ...r,
    width,
    height,
    x: left ? r.x + r.width - width : r.x,
    y: top ? r.y + r.height - height : r.y,
  };
}
