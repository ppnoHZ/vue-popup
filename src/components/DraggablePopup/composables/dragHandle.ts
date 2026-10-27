import type { DragHandle } from "../types";

/** Resolve per pointerdown so dynamic slot nodes and ref callbacks stay current. */
export function resolveDragHandle(
  panel: HTMLElement,
  target: EventTarget | null,
  source: DragHandle,
): HTMLElement | undefined {
  if (source === false || !(target instanceof Element)) return;
  // Nested panels own their gestures, even when mounted inline inside this panel.
  if (target.closest(".draggable-popup") !== panel) return;
  if (
    target.closest(
      'button,input,textarea,select,a,[role="button"],[contenteditable]:not([contenteditable="false"]),[data-no-drag],[data-handle]',
    )
  )
    return;
  let handle: Element | null | undefined;
  if (typeof source === "string") {
    try {
      handle = target.closest(source);
    } catch {
      return; // Invalid selectors disable this source rather than breaking the form.
    }
  } else {
    handle = typeof source === "function" ? source() : source;
  }
  if (
    handle instanceof HTMLElement &&
    panel.contains(handle) &&
    handle.contains(target)
  )
    return handle;
}
