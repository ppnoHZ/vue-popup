<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  useId,
  useAttrs,
  watch,
  watchEffect,
  watchPostEffect,
} from "vue";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/vue";
import type {
  CloseReason,
  PopupEvents,
  PopupExpose,
  PopupMode,
  PopupProps,
  PopupRect,
  ResizeHandle,
} from "./types";
import {
  constrain,
  resizeRect,
  dockRect,
  viewportRect,
  snapRectToViewport,
} from "./composables/geometry";
import "./styles.css";
import RenderContent from "./RenderContent";
import { resolveLength } from "./composables/length";
import { lockBody } from "./composables/scrollLock";
import { createFramePublisher } from "./composables/framePublisher";
import { viewportSize } from "./composables/viewport";

const props = withDefaults(defineProps<PopupProps>(), {
  modelValue: undefined,
  open: undefined,
  visible: undefined,
  keyboard: undefined,
  closable: true,
  mask: false,
  maskClosable: true,
  centered: false,
  destroyOnClose: undefined,
  forceRender: false,
  confirmLoading: false,
  footer: undefined,
  extra: undefined,
  closeIcon: undefined,
  getContainer: undefined,
  okText: "确定",
  cancelText: "取消",
  variant: "popup",
  maximizable: true,
  motion: true,
  motionDuration: 200,
  title: "Popup",
  placement: "bottom-start",
  offset: 8,
  boundaryPadding: 8,
  autoFlip: true,
  autoShift: true,
  width: undefined,
  height: undefined,
  minWidth: 260,
  minHeight: 180,
  maxWidth: undefined,
  maxHeight: undefined,
  draggable: true,
  resizable: true,
  keepInViewport: true,
  snapToEdge: true,
  snapThreshold: 16,
  closeOnOutsideClick: false,
  closeOnEsc: true,
  teleportTo: "body",
  zIndex: 2000,
  trigger: "click",
});
const emit = defineEmits<PopupEvents>();
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const isOpen = computed(
  () => props.open ?? props.visible ?? props.modelValue ?? false,
);
const media =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : undefined;
const reducedMotion = ref(media?.matches ?? false);
const onMotionPreference = (event: MediaQueryListEvent) => {
  reducedMotion.value = event.matches;
};
media?.addEventListener("change", onMotionPreference);
const motionEnabled = computed(
  () =>
    props.motion && props.motionDuration > 0 && !reducedMotion.value && !!media,
);
const geometryMotion = ref(false);
const leaving = ref(false);
watch(
  isOpen,
  (open, previous) => {
    leaving.value = !open && !!previous && motionEnabled.value;
  },
  { flush: "sync" },
);
let geometryTimer: ReturnType<typeof setTimeout> | undefined;
let openNotified = false,
  closeNotified = true;
function cancelGeometryMotion() {
  clearTimeout(geometryTimer);
  geometryTimer = undefined;
  geometryMotion.value = false;
}
function beginGeometryMotion() {
  cancelGeometryMotion();
  if (!motionEnabled.value) return;
  geometryMotion.value = true;
  geometryTimer = setTimeout(cancelGeometryMotion, props.motionDuration + 50);
}
function afterEnter() {
  if (!isOpen.value || openNotified) return;
  openNotified = true;
  emit("afterOpenChange", true);
  emit("afterVisibleChange", true);
}
function afterLeave() {
  if (isOpen.value || closeNotified) return;
  closeNotified = true;
  leaving.value = false;
  restore();
  cancelGeometryMotion();
  props.afterClose?.();
  emit("afterOpenChange", false);
  emit("afterVisibleChange", false);
  focusTrigger();
}
watch(motionEnabled, (value) => {
  if (!value) {
    cancelGeometryMotion();
    if (isOpen.value) afterEnter();
    else afterLeave();
  }
});
// Ant-style bindings retain content by default; preserve legacy v-model behavior.
const destroyContent = computed(
  () =>
    props.destroyOnClose ??
    (props.open === undefined && props.visible === undefined),
);
watch(
  () => (isOpen.value || leaving.value) && props.mask,
  (locked, _, onCleanup) => {
    if (locked) onCleanup(lockBody(document));
  },
  { immediate: true },
);
const effectiveVariant = computed(() =>
  props.variant === "popup" &&
  !slots.trigger &&
  (props.open !== undefined || props.visible !== undefined)
    ? "modal"
    : props.variant,
);
const limits = computed(() => ({
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  maxWidth: props.maxWidth ?? Number.MAX_SAFE_INTEGER,
  maxHeight: props.maxHeight ?? Number.MAX_SAFE_INTEGER,
  boundaryPadding: props.boundaryPadding,
}));
const initialWidth = () =>
  resolveLength(
    props.width ??
      (effectiveVariant.value === "modal"
        ? 520
        : effectiveVariant.value === "drawer"
          ? 378
          : 360),
    "width",
    360,
  );
const initialHeight = () => resolveLength(props.height ?? 280, "height", 280);
const hasRendered = ref(false);
const container = computed(() =>
  typeof props.getContainer === "function"
    ? props.getContainer()
    : props.getContainer === false
      ? props.teleportTo
      : (props.getContainer ?? props.teleportTo),
);
const side = computed(() =>
  ["top", "bottom", "left", "right"].includes(props.placement)
    ? (props.placement as "top" | "bottom" | "left" | "right")
    : "right",
);
const initialMode = (): PopupMode =>
  effectiveVariant.value === "drawer"
    ? "docked"
    : effectiveVariant.value === "modal"
      ? "centered"
      : "anchored";
const effectiveHandles = computed<ResizeHandle[]>(
  () => props.resizeHandles ?? ["tl", "tm", "tr", "mr", "br", "bm", "bl", "ml"],
);
const slots = defineSlots<{
  trigger(): unknown;
  header(): unknown;
  default(): unknown;
  footer(): unknown;
  title(): unknown;
  extra(): unknown;
  closeIcon(): unknown;
  okText(): unknown;
  cancelText(): unknown;
}>();
const id = `draggable-popup-${useId()}`;
const anchor = ref<HTMLElement>(),
  panel = ref<HTMLElement>();
const hasFocusableTrigger = ref(false);
// Slot components may render their own native button. Put ARIA on that button
// and avoid adding a second tab stop around it.
watchPostEffect(() => {
  const target = anchor.value?.querySelector<HTMLElement>(
    "button,input,a[href],[tabindex]",
  );
  hasFocusableTrigger.value = !!target;
  target?.setAttribute("aria-expanded", String(isOpen.value));
  target?.setAttribute("aria-controls", id);
});
const mode = ref<PopupMode>(initialMode()),
  active = ref(false),
  layer = ref(props.zIndex);
const maximized = ref(false);
let restoreRect: PopupRect | undefined;
let liveInteractionRect: PopupRect | undefined;
const dragOrigin = ref<{ x: number; y: number }>();
const rect = reactive<PopupRect>({
  x: 0,
  y: 0,
  width: initialWidth(),
  height: initialHeight(),
});
let reason: CloseReason = "programmatic",
  stopPosition: (() => void) | undefined,
  observer: MutationObserver | undefined;
let stopInteraction: (() => void) | undefined,
  epoch = 0;
let viewportObserver: ResizeObserver | undefined;
const reference = computed(() =>
  isOpen.value && mode.value === "anchored" && !maximized.value
    ? anchor.value
    : undefined,
);
const floating = useFloating(reference, panel, {
  strategy: "fixed",
  transform: false,
  placement: computed(() => props.placement),
  middleware: computed(() => [
    offset(props.offset),
    ...(props.autoFlip ? [flip({ padding: props.boundaryPadding })] : []),
    ...(props.autoShift
      ? [shift({ padding: props.boundaryPadding, crossAxis: true })]
      : []),
  ]),
});
function setMode(value: PopupMode) {
  if (mode.value !== value) {
    mode.value = value;
    emit("mode-change", { mode: value });
  }
}
function clip() {
  const viewport = viewportSize();
  Object.assign(
    rect,
    constrain(rect, limits.value, viewport.width, viewport.height),
  );
}
function updatePosition() {
  if (!isOpen.value) return;
  const viewport = viewportSize();
  if (maximized.value) {
    Object.assign(
      rect,
      viewportRect(props.boundaryPadding, viewport.width, viewport.height),
    );
  } else if (mode.value === "docked") {
    Object.assign(
      rect,
      dockRect(
        rect,
        limits.value,
        viewport.width,
        viewport.height,
        side.value,
        side.value === "left" || side.value === "right"
          ? props.height === undefined
          : props.width === undefined,
      ),
    );
  } else if (mode.value === "centered") {
    clip();
    rect.x = (viewport.width - rect.width) / 2;
    rect.y = props.centered
      ? (viewport.height - rect.height) / 2
      : Math.min(100, viewport.height - props.boundaryPadding - rect.height);
    clip();
  } else if (mode.value === "anchored") {
    clip();
    floating.update();
  } else if (props.keepInViewport) clip();
}
// Keep this callback distinct from autoUpdate's callback. DOM listeners deduplicate
// identical callbacks; autoUpdate cleanup must not remove our detached/maximized resize listener.
function onViewportResize() {
  cancelGeometryMotion();
  stopInteraction?.();
  updatePosition();
}
watch(
  () => [
    props.minWidth,
    props.minHeight,
    props.maxWidth,
    props.maxHeight,
    props.boundaryPadding,
    props.keepInViewport,
    props.centered,
    side.value,
  ],
  updatePosition,
  { flush: "post" },
);
watchEffect(() => {
  if (
    isOpen.value &&
    mode.value === "anchored" &&
    !maximized.value &&
    floating.isPositioned.value
  ) {
    rect.x = floating.x.value;
    rect.y = floating.y.value;
  }
});
watch(floating.placement, (p) => {
  if (isOpen.value && mode.value === "anchored" && !maximized.value)
    emit("placement-change", { placement: p });
});
function raise() {
  const levels = Array.from(
    document.querySelectorAll<HTMLElement>(".draggable-popup"),
  )
    .filter((el) => el !== panel.value && el.style.display !== "none")
    .map((el) => Number(el.style.zIndex) || 0);
  layer.value = Math.max(props.zIndex, ...levels) + 1;
}
function requestClose(value: CloseReason, event?: MouseEvent | KeyboardEvent) {
  if (!isOpen.value) return;
  reason = value;
  emit("cancel", event);
  emit("close-request", { reason: value, event });
  requestOpen(false);
}
function requestOpen(value: boolean) {
  emit("update:modelValue", value);
  emit("update:open", value);
  emit("update:visible", value);
  emit("change", value);
}
function confirm(event: MouseEvent) {
  if (
    props.confirmLoading ||
    props.okButtonProps?.disabled ||
    props.okButtonProps?.loading
  )
    return;
  emit("ok", event);
}
function toggle(event?: MouseEvent | KeyboardEvent) {
  if (props.trigger === "manual") return;
  if (isOpen.value) requestClose("trigger", event);
  else requestOpen(true);
}
function triggerKey(e: KeyboardEvent) {
  if (e.target !== anchor.value) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggle(e);
  }
}
function focusTrigger() {
  const el =
    anchor.value?.querySelector<HTMLElement>(
      "button, input, a[href], [tabindex]",
    ) ?? anchor.value;
  el?.focus();
}
function outside(e: PointerEvent) {
  if (props.mask) return;
  const path = e.composedPath();
  if (
    props.closeOnOutsideClick &&
    !path.includes(panel.value!) &&
    !path.includes(anchor.value!)
  )
    requestClose("outside", e);
}
function escape(e: KeyboardEvent) {
  if (e.key !== "Escape" || !(props.keyboard ?? props.closeOnEsc)) return;
  const top = Math.max(
    ...Array.from(document.querySelectorAll<HTMLElement>(".draggable-popup"))
      .filter((el) => el.style.display !== "none")
      .map((el) => Number(el.style.zIndex)),
  );
  if (layer.value === top) {
    e.preventDefault();
    requestClose("escape", e);
  }
}
function cleanup() {
  viewportObserver?.disconnect();
  viewportObserver = undefined;
  stopPosition?.();
  stopPosition = undefined;
  observer?.disconnect();
  observer = undefined;
  stopInteraction?.();
  window.removeEventListener("resize", onViewportResize);
  window.visualViewport?.removeEventListener("resize", onViewportResize);
  document.removeEventListener("pointerdown", outside, true);
  document.removeEventListener("keydown", escape);
}
watch(
  [reference, panel],
  () => {
    stopPosition?.();
    stopPosition = undefined;
    if (reference.value && panel.value) {
      stopPosition = autoUpdate(reference.value, panel.value, updatePosition, {
        animationFrame: true,
      });
    }
  },
  { flush: "post" },
);
// Maximizing pauses positioning, but an anchored popup must still detect
// removal of its trigger. Detached panels and drawers need neither observer.
watch(
  [
    () =>
      isOpen.value && mode.value === "anchored" ? anchor.value : undefined,
    panel,
  ],
  ([element]) => {
    observer?.disconnect();
    observer = undefined;
    if (element && panel.value) {
      const mountedAnchor = element.firstElementChild ?? element;
      observer = new MutationObserver(() => {
        if (!element.isConnected || !mountedAnchor.isConnected)
          requestClose("anchor-removed");
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  },
  { flush: "post" },
);
watch(
  () => isOpen.value,
  async (open, previous) => {
    const generation = ++epoch;
    if (!open) {
      cleanup();
      cancelGeometryMotion();
      if (previous) {
        closeNotified = false;
        emit("close", { reason });
        reason = "programmatic";
        if (!motionEnabled.value) afterLeave();
      }
      return;
    }
    restore();
    cancelGeometryMotion();
    openNotified = false;
    closeNotified = true;
    hasRendered.value = true;
    setMode(initialMode());
    clip();
    emit("open");
    await nextTick();
    if (generation !== epoch || !isOpen.value) return;
    raise();
    updatePosition();
    window.addEventListener("resize", onViewportResize);
    window.visualViewport?.addEventListener("resize", onViewportResize);
    // Scrollbars can appear/disappear without a window resize (including body locks).
    if (typeof ResizeObserver !== "undefined") {
      let previous = viewportSize();
      viewportObserver = new ResizeObserver(() => {
        const next = viewportSize();
        if (next.width !== previous.width || next.height !== previous.height) {
          previous = next;
          onViewportResize();
        }
      });
      viewportObserver.observe(document.documentElement);
    }
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    if (!motionEnabled.value) afterEnter();
  },
  // Settle lifecycle flags before Vue can finish a zero-duration/cancelled transition.
  { immediate: true, flush: "sync" },
);
function resetPosition() {
  stopInteraction?.();
  restore();
  beginGeometryMotion();
  setMode(initialMode());
  nextTick(updatePosition);
}
function resetSize() {
  stopInteraction?.();
  restore();
  beginGeometryMotion();
  rect.width = initialWidth();
  rect.height = initialHeight();
  updatePosition();
}
function getRect() {
  return { ...(liveInteractionRect ?? rect) };
}
watch(side, () => {
  if (mode.value !== "docked") return;
  stopInteraction?.();
  const next = { ...getRect(), width: initialWidth(), height: initialHeight() };
  if (maximized.value) restoreRect = next;
  else Object.assign(rect, next);
  updatePosition();
});
function maximize() {
  if (!isOpen.value || !props.maximizable || maximized.value) return;
  stopInteraction?.();
  restoreRect = getRect();
  beginGeometryMotion();
  maximized.value = true;
  updatePosition();
  raise();
  emit("maximize-change", { maximized: true, rect: getRect() });
}
function restore() {
  if (!maximized.value) return;
  if (isOpen.value) beginGeometryMotion();
  maximized.value = false;
  if (restoreRect) Object.assign(rect, restoreRect);
  restoreRect = undefined;
  // Restore even when closed, but never retain viewport-sized dimensions.
  if (isOpen.value) updatePosition();
  emit("maximize-change", { maximized: false, rect: getRect() });
}
function toggleMaximize() {
  if (maximized.value) restore();
  else maximize();
}
function isMaximized() {
  return maximized.value;
}
watch(
  () => props.maximizable,
  (value) => {
    if (!value) restore();
  },
);
watch(effectiveVariant, () => {
  stopInteraction?.();
  restore();
  setMode(initialMode());
  updatePosition();
});
function start(e: PointerEvent, handle?: ResizeHandle) {
  if (
    e.button !== 0 ||
    maximized.value ||
    active.value ||
    (handle ? !props.resizable : !props.draggable)
  )
    return;
  if (
    !handle &&
    (e.target as HTMLElement).closest(
      'button,input,textarea,select,a,[role="button"],[contenteditable], [data-no-drag]',
    )
  )
    return;
  if (!panel.value) return;
  e.preventDefault();
  raise();
  const actual = panel.value.getBoundingClientRect();
  cancelGeometryMotion();
  Object.assign(rect, {
    x: actual.x,
    y: actual.y,
    width: actual.width,
    height: actual.height,
  });
  setMode("detached");
  const initial = { ...rect },
    x = e.clientX,
    y = e.clientY,
    pointer = e.pointerId,
    kind = handle ? "resize" : "drag";
  const captureTarget = e.currentTarget as HTMLElement;
  if (!handle) dragOrigin.value = { x: initial.x, y: initial.y };
  liveInteractionRect = { ...initial };
  let published = { ...initial };
  const frames = createFramePublisher<PopupRect>(
    (next) => {
      if (
        next.x === published.x &&
        next.y === published.y &&
        next.width === published.width &&
        next.height === published.height
      )
        return;
      Object.assign(rect, next);
      published = { ...next };
      if (kind === "drag") emit("drag", { ...next });
      else emit("resize", { ...next });
    },
    typeof window.requestAnimationFrame === "function"
      ? {
          request: (callback) => window.requestAnimationFrame(callback),
          cancel: (id) => window.cancelAnimationFrame(id),
        }
      : undefined,
  );
  // Rebase resizing at every pointer sample after constraints are applied.
  // Discard overshoot instead of storing a dead zone beyond min/max or viewport edges.
  let resizeBase = { ...initial },
    resizeX = x,
    resizeY = y;
  if (e.isTrusted) captureTarget.setPointerCapture?.(pointer);
  active.value = true;
  if (handle) emit("resize-start", getRect());
  else emit("drag-start", getRect());
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    const viewport = props.keepInViewport ? viewportSize() : undefined;
    let next: PopupRect;
    if (handle) {
      next = resizeRect(
        resizeBase,
        handle,
        event.clientX - resizeX,
        event.clientY - resizeY,
        limits.value,
        viewport?.width ?? Number.MAX_SAFE_INTEGER,
        viewport?.height ?? Number.MAX_SAFE_INTEGER,
      );
      resizeBase = next;
      resizeX = event.clientX;
      resizeY = event.clientY;
    } else {
      next = {
        ...initial,
        x: initial.x + event.clientX - x,
        y: initial.y + event.clientY - y,
      };
      if (viewport) {
        if (props.snapToEdge)
          next = snapRectToViewport(
            next,
            limits.value,
            viewport.width,
            viewport.height,
            props.snapThreshold,
          );
        else
          next = constrain(next, limits.value, viewport.width, viewport.height);
      }
    }
    liveInteractionRect = next;
    frames.queue(next);
  };
  const finish = (event?: PointerEvent) => {
    if (event && event.pointerId !== pointer) return;
    if (!active.value) return;
    active.value = false;
    frames.flush();
    frames.cancel();
    liveInteractionRect = undefined;
    dragOrigin.value = undefined;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    window.removeEventListener("lostpointercapture", finish);
    window.removeEventListener("blur", blur);
    if (captureTarget.hasPointerCapture?.(pointer))
      captureTarget.releasePointerCapture(pointer);
    stopInteraction = undefined;
    if (kind === "drag") emit("drag-end", getRect());
    else emit("resize-end", getRect());
  };
  const blur = () => finish();
  stopInteraction = () => finish();
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);
  window.addEventListener("lostpointercapture", finish);
  window.addEventListener("blur", blur);
}
onBeforeUnmount(() => {
  ++epoch;
  cleanup();
  cancelGeometryMotion();
  media?.removeEventListener("change", onMotionPreference);
});
defineExpose<PopupExpose>({
  resetPosition,
  resetSize,
  updatePosition,
  getRect,
  maximize,
  restore,
  toggleMaximize,
  isMaximized,
});
</script>

<template>
  <span
    v-if="$slots.trigger || effectiveVariant === 'popup'"
    ref="anchor"
    class="draggable-popup__trigger"
    :role="hasFocusableTrigger ? undefined : 'button'"
    :tabindex="hasFocusableTrigger ? undefined : 0"
    :aria-expanded="isOpen"
    :aria-controls="id"
    @click="toggle"
    @keydown="triggerKey"
    ><slot name="trigger"
  /></span>
  <Teleport :to="container" :disabled="getContainer === false">
    <Transition name="dp-mask" appear :css="motionEnabled">
      <div
        v-if="isOpen && mask"
        class="draggable-popup__mask"
        :style="[
          maskStyle,
          {
            zIndex: layer - 1,
            '--dp-motion-duration': `${Math.max(0, motionDuration)}ms`,
          },
        ]"
        aria-hidden="true"
        @click="maskClosable && requestClose('outside', $event)"
      />
    </Transition>
    <Transition
      name="dp-panel"
      appear
      :css="motionEnabled"
      @after-enter="afterEnter"
      @after-leave="afterLeave"
    >
      <section
        v-if="isOpen || forceRender || (!destroyContent && hasRendered)"
        v-show="isOpen"
        v-bind="attrs"
        :id="id"
        ref="panel"
        class="draggable-popup"
        :class="[
          rootClassName,
          wrapClassName,
          {
            'draggable-popup--active': active,
            'draggable-popup--maximized': maximized,
            'draggable-popup--drawer': effectiveVariant === 'drawer',
            'draggable-popup--geometry-motion': geometryMotion,
            'draggable-popup--dragging': !!dragOrigin,
          },
        ]"
        role="dialog"
        :aria-modal="mask || undefined"
        :aria-labelledby="`${id}-title`"
        :data-mode="mode"
        :data-maximized="maximized"
        :data-drawer-placement="
          effectiveVariant === 'drawer' ? side : undefined
        "
        :data-placement="
          mode === 'anchored' ? floating.placement.value : undefined
        "
        :style="[
          rootStyle,
          drawerStyle,
          {
            '--dp-motion-duration': `${Math.max(0, motionDuration)}ms`,
            left: `${dragOrigin?.x ?? rect.x}px`,
            top: `${dragOrigin?.y ?? rect.y}px`,
            ...(dragOrigin
              ? {
                  transform: `translate3d(${rect.x - dragOrigin.x}px,${rect.y - dragOrigin.y}px,0)`,
                }
              : {}),
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            zIndex: layer,
          },
        ]"
        @pointerdown="raise"
      >
        <header
          class="draggable-popup__header"
          :style="headerStyle"
          @pointerdown="start($event)"
        >
          <div :id="`${id}-title`" class="draggable-popup__title">
            <slot name="title">
              <slot name="header"><RenderContent :value="title" /></slot>
            </slot>
          </div>
          <div
            v-if="$slots.extra || extra"
            class="draggable-popup__extra"
            data-no-drag
          >
            <slot name="extra"><RenderContent :value="extra" /></slot>
          </div>
          <button type="button" aria-label="复位位置" @click="resetPosition">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M3 5a5.5 5.5 0 1 1-0.5 5M3 1v4h4" />
            </svg>
          </button>
          <button
            v-if="maximizable"
            type="button"
            :aria-label="maximized ? '还原面板' : '放大面板'"
            :title="maximized ? '还原面板' : '放大面板'"
            :aria-pressed="maximized"
            @click="toggleMaximize"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path v-if="maximized" d="M5 5V2h9v9h-3M2 5h9v9H2z" />
              <path v-else d="M2 2h12v12H2zM2 5h12" />
            </svg>
          </button>
          <button
            v-if="closable"
            type="button"
            aria-label="关闭面板"
            @click="requestClose('close-button', $event)"
          >
            <slot name="closeIcon">
              <RenderContent
                v-if="closeIcon != null"
                :value="closeIcon"
              /><template v-else>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <path d="m3 3 10 10M13 3 3 13" />
                </svg>
              </template>
            </slot>
          </button>
        </header>
        <div class="draggable-popup__body" :style="bodyStyle"><slot /></div>
        <footer
          v-if="
            $slots.footer ||
            (footer !== null &&
              (footer !== undefined || effectiveVariant === 'modal'))
          "
          class="draggable-popup__footer"
          :style="footerStyle"
        >
          <slot name="footer">
            <RenderContent
              v-if="footer !== undefined"
              :value="footer"
            /><template v-else>
              <button
                type="button"
                class="draggable-popup__button"
                :class="cancelButtonProps?.class"
                :style="cancelButtonProps?.style"
                :disabled="
                  cancelButtonProps?.disabled || cancelButtonProps?.loading
                "
                @click="requestClose('close-button', $event)"
              >
                <slot name="cancelText">
                  <RenderContent :value="cancelText" />
                </slot>
              </button>
              <button
                type="button"
                class="draggable-popup__button draggable-popup__button--primary"
                :class="[
                  okButtonProps?.class,
                  { 'draggable-popup__button--danger': okButtonProps?.danger },
                ]"
                :style="okButtonProps?.style"
                :disabled="
                  confirmLoading ||
                  okButtonProps?.disabled ||
                  okButtonProps?.loading
                "
                :aria-busy="confirmLoading || okButtonProps?.loading || false"
                @click="confirm"
              >
                <span
                  v-if="confirmLoading || okButtonProps?.loading"
                  class="draggable-popup__spinner"
                  aria-hidden="true"
                /><slot name="okText"><RenderContent :value="okText" /></slot>
              </button>
            </template>
          </slot>
        </footer>
        <template v-if="resizable && !maximized">
          <span
            v-for="handle in effectiveHandles"
            :key="handle"
            :class="[
              'draggable-popup__handle',
              `draggable-popup__handle--${handle}`,
            ]"
            :data-handle="handle"
            role="separator"
            :aria-label="`调整尺寸 ${handle}`"
            tabindex="0"
            @pointerdown.stop="start($event, handle)"
          />
        </template>
      </section>
    </Transition>
  </Teleport>
</template>
