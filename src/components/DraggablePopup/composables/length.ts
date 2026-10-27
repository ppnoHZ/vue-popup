/** Resolve initial Ant-style CSS dimensions to viewport CSS pixels. */
export function resolveLength(
  value: number | string,
  axis: "width" | "height",
  fallback: number,
) {
  if (typeof value === "number")
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
  if (typeof document === "undefined") return fallback;
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;box-sizing:border-box;";
  el.style[axis] = /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
  if (!el.style[axis]) return fallback;
  document.body.append(el);
  const result = el.getBoundingClientRect()[axis];
  el.remove();
  return result > 0 ? result : fallback;
}
