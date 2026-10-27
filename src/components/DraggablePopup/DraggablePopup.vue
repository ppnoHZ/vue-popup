<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  useId,
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
import { constrain, resizeRect } from "./composables/geometry";
import "./styles.css";

const props = withDefaults(defineProps<PopupProps>(), {
  title: "Popup",
  placement: "bottom-start",
  offset: 8,
  boundaryPadding: 8,
  autoFlip: true,
  autoShift: true,
  width: 360,
  height: 280,
  minWidth: 260,
  minHeight: 180,
  maxWidth: 960,
  maxHeight: 800,
  draggable: true,
  resizable: true,
  resizeHandles: () => ["br"],
  keepInViewport: true,
  closeOnOutsideClick: false,
  closeOnEsc: true,
  teleportTo: "body",
  zIndex: 2000,
  trigger: "click",
});
const emit = defineEmits<PopupEvents>();
defineSlots<{
  trigger(): unknown;
  header(): unknown;
  default(): unknown;
  footer(): unknown;
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
  target?.setAttribute("aria-expanded", String(props.modelValue));
  target?.setAttribute("aria-controls", id);
});
const mode = ref<PopupMode>("anchored"),
  active = ref(false),
  layer = ref(props.zIndex);
const rect = reactive<PopupRect>({
  x: 0,
  y: 0,
  width: props.width,
  height: props.height,
});
let reason: CloseReason = "programmatic",
  stopPosition: (() => void) | undefined,
  observer: MutationObserver | undefined;
let stopInteraction: (() => void) | undefined,
  epoch = 0;
const reference = computed(() =>
  props.modelValue && mode.value === "anchored" ? anchor.value : undefined,
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
  Object.assign(
    rect,
    constrain(rect, props, window.innerWidth, window.innerHeight),
  );
}
function updatePosition() {
  if (!props.modelValue) return;
  if (mode.value === "anchored") {
    clip();
    floating.update();
  } else if (props.keepInViewport) clip();
}
watch(
  () => [
    props.minWidth,
    props.minHeight,
    props.maxWidth,
    props.maxHeight,
    props.boundaryPadding,
    props.keepInViewport,
  ],
  updatePosition,
  { flush: "post" },
);
watchEffect(() => {
  if (
    props.modelValue &&
    mode.value === "anchored" &&
    floating.isPositioned.value
  ) {
    rect.x = floating.x.value;
    rect.y = floating.y.value;
  }
});
watch(floating.placement, (p) => {
  if (props.modelValue && mode.value === "anchored")
    emit("placement-change", { placement: p });
});
function raise() {
  const levels = Array.from(
    document.querySelectorAll<HTMLElement>(".draggable-popup"),
  )
    .filter((el) => el !== panel.value)
    .map((el) => Number(el.style.zIndex) || 0);
  layer.value = Math.max(props.zIndex, ...levels) + 1;
}
function requestClose(value: CloseReason) {
  if (!props.modelValue) return;
  reason = value;
  emit("update:modelValue", false);
}
function toggle() {
  if (props.trigger === "manual") return;
  if (props.modelValue) requestClose("trigger");
  else emit("update:modelValue", true);
}
function triggerKey(e: KeyboardEvent) {
  if (e.target !== anchor.value) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggle();
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
  const path = e.composedPath();
  if (
    props.closeOnOutsideClick &&
    !path.includes(panel.value!) &&
    !path.includes(anchor.value!)
  )
    requestClose("outside");
}
function escape(e: KeyboardEvent) {
  if (e.key !== "Escape" || !props.closeOnEsc) return;
  const top = Math.max(
    ...Array.from(
      document.querySelectorAll<HTMLElement>(".draggable-popup"),
    ).map((el) => Number(el.style.zIndex)),
  );
  if (layer.value === top) {
    e.preventDefault();
    requestClose("escape");
  }
}
function cleanup() {
  stopPosition?.();
  stopPosition = undefined;
  observer?.disconnect();
  observer = undefined;
  stopInteraction?.();
  window.removeEventListener("resize", updatePosition);
  window.visualViewport?.removeEventListener("resize", updatePosition);
  document.removeEventListener("pointerdown", outside, true);
  document.removeEventListener("keydown", escape);
}
watch(
  [() => props.modelValue, mode, anchor, panel],
  () => {
    stopPosition?.();
    stopPosition = undefined;
    if (reference.value && panel.value)
      stopPosition = autoUpdate(reference.value, panel.value, updatePosition, {
        animationFrame: true,
      });
  },
  { flush: "post" },
);
watch(
  () => props.modelValue,
  async (open, previous) => {
    const generation = ++epoch;
    if (!open) {
      cleanup();
      if (previous) {
        emit("close", { reason });
        reason = "programmatic";
        focusTrigger();
      }
      return;
    }
    setMode("anchored");
    clip();
    emit("open");
    await nextTick();
    if (generation !== epoch || !props.modelValue) return;
    raise();
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("resize", updatePosition);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    const mountedAnchor = anchor.value?.firstElementChild ?? anchor.value;
    observer = new MutationObserver(() => {
      if (
        mode.value === "anchored" &&
        (!anchor.value?.isConnected || !mountedAnchor?.isConnected)
      )
        requestClose("anchor-removed");
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
  { immediate: true, flush: "post" },
);
function resetPosition() {
  stopInteraction?.();
  setMode("anchored");
  nextTick(updatePosition);
}
function resetSize() {
  rect.width = props.width;
  rect.height = props.height;
  updatePosition();
}
function getRect() {
  return { ...rect };
}
function start(e: PointerEvent, handle?: ResizeHandle) {
  if (
    e.button !== 0 ||
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
  if (e.isTrusted) captureTarget.setPointerCapture?.(pointer);
  active.value = true;
  if (handle) emit("resize-start", getRect());
  else emit("drag-start", getRect());
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    if (handle)
      Object.assign(
        rect,
        resizeRect(
          initial,
          handle,
          event.clientX - x,
          event.clientY - y,
          props,
          props.keepInViewport ? window.innerWidth : Number.MAX_SAFE_INTEGER,
          props.keepInViewport ? window.innerHeight : Number.MAX_SAFE_INTEGER,
        ),
      );
    else {
      rect.x = initial.x + event.clientX - x;
      rect.y = initial.y + event.clientY - y;
      if (props.keepInViewport) clip();
    }
    if (kind === "drag") emit("drag", getRect());
    else emit("resize", getRect());
  };
  const finish = (event?: PointerEvent) => {
    if (event && event.pointerId !== pointer) return;
    if (!active.value) return;
    active.value = false;
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
});
defineExpose<PopupExpose>({
  resetPosition,
  resetSize,
  updatePosition,
  getRect,
});
</script>

<template>
  <span
    ref="anchor"
    class="draggable-popup__trigger"
    :role="hasFocusableTrigger ? undefined : 'button'"
    :tabindex="hasFocusableTrigger ? undefined : 0"
    :aria-expanded="modelValue"
    :aria-controls="id"
    @click="toggle"
    @keydown="triggerKey"
    ><slot name="trigger"
  /></span>
  <Teleport :to="teleportTo">
    <section
      v-if="modelValue"
      :id="id"
      ref="panel"
      class="draggable-popup"
      :class="{ 'draggable-popup--active': active }"
      role="dialog"
      :aria-label="title"
      :data-mode="mode"
      :data-placement="floating.placement.value"
      :style="{
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        zIndex: layer,
      }"
      @pointerdown="raise"
    >
      <header class="draggable-popup__header" @pointerdown="start($event)">
        <div class="draggable-popup__title">
          <slot name="header">{{ title }}</slot>
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
</button
        ><button
          type="button"
          aria-label="关闭面板"
          @click="requestClose('close-button')"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="m3 3 10 10M13 3 3 13" />
          </svg>
        </button>
      </header>
      <div class="draggable-popup__body"><slot /></div>
      <footer v-if="$slots.footer" class="draggable-popup__footer">
        <slot name="footer" />
      </footer>
      <template v-if="resizable">
        <span
          v-for="handle in resizeHandles"
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
  </Teleport>
</template>
