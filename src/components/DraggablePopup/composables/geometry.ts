import type { PopupRect, ResizeHandle, DrawerPlacement } from "../types";
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
/** Snap from the raw pointer-derived rectangle, never from the previous snapped
 * rectangle, so moving away immediately releases the edge without accumulated drift. */
export function snapRectToViewport(
  r: PopupRect,
  l: Limits,
  vw: number,
  vh: number,
  threshold: number,
): PopupRect {
  const result = constrain(r, l, vw, vh),
    p = bounds(l, vw, vh).p;
  const distance = Number.isFinite(threshold) ? Math.max(0, threshold) : 0;
  const right = vw - p - result.width,
    bottom = vh - p - result.height;
  const xLeft = result.x - p,
    xRight = right - result.x,
    yTop = result.y - p,
    yBottom = bottom - result.y;
  return {
    ...result,
    x:
      Math.min(xLeft, xRight) <= distance
        ? xLeft <= xRight
          ? p
          : right
        : result.x,
    y:
      Math.min(yTop, yBottom) <= distance
        ? yTop <= yBottom
          ? p
          : bottom
        : result.y,
  };
}
/** Maximizing intentionally ignores normal min/max dimensions. */
export function viewportRect(
  padding: number,
  vw: number,
  vh: number,
): PopupRect {
  const p = clamp(padding, 0, Math.max(0, Math.min(vw, vh) / 2));
  return {
    x: p,
    y: p,
    width: Math.max(0, vw - 2 * p),
    height: Math.max(0, vh - 2 * p),
  };
}
export function dockRight(
  r: PopupRect,
  l: Limits,
  vw: number,
  vh: number,
): PopupRect {
  const result = constrain({ ...r, height: vh }, l, vw, vh);
  return {
    ...result,
    x: vw - bounds(l, vw, vh).p - result.width,
    y: bounds(l, vw, vh).p,
  };
}
export function dockRect(
  r: PopupRect,
  l: Limits,
  vw: number,
  vh: number,
  side: DrawerPlacement,
  fillCrossAxis = true,
): PopupRect {
  const vertical = side === "left" || side === "right";
  const result = constrain(
      {
        ...r,
        ...(fillCrossAxis ? (vertical ? { height: vh } : { width: vw }) : {}),
      },
      l,
      vw,
      vh,
    ),
    p = bounds(l, vw, vh).p;
  return {
    ...result,
    x: side === "right" ? vw - p - result.width : p,
    y: side === "bottom" ? vh - p - result.height : p,
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
