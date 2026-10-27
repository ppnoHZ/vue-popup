<script setup lang="ts">
import type { PopupExpose } from "../components/DraggablePopup";
import type { PopupRect } from "../components/DraggablePopup";
import { shallowRef, watch } from "vue";
const props = defineProps<{
  panels: PopupExpose[];
  names: string[];
  visible: boolean[];
  states: Record<number, Record<string, unknown>>;
  logs: string[];
  drawer?: PopupExpose;
  drawerOpen: boolean;
  drawerMode: string;
  drawerMaximized: boolean;
  migrationEvents: Record<string, number>;
  placement: string;
}>();
const snapshot = shallowRef<{
  panels: (PopupRect | undefined)[];
  drawer?: PopupRect;
}>({ panels: [] });
function equal(a: PopupRect | undefined, b: PopupRect | undefined) {
  return (
    a === b ||
    (!!a &&
      !!b &&
      a.x === b.x &&
      a.y === b.y &&
      a.width === b.width &&
      a.height === b.height)
  );
}
function refresh() {
  const next = {
    panels: props.panels.map((panel) => panel?.getRect()),
    drawer: props.drawer?.getRect(),
  };
  if (
    next.panels.length !== snapshot.value.panels.length ||
    !next.panels.every((r, i) => equal(r, snapshot.value.panels[i])) ||
    !equal(next.drawer, snapshot.value.drawer)
  )
    snapshot.value = next;
}
watch(
  () => [...props.visible, props.drawerOpen],
  () => {
    refresh();
  },
  { immediate: true, flush: "post" },
);
watch(
  () => props.visible.some(Boolean) || props.drawerOpen,
  (open, _, onCleanup) => {
    if (!open) return;
    const timer = setInterval(refresh, 100);
    onCleanup(() => clearInterval(timer));
  },
  { immediate: true },
);
watch(() => props.logs, refresh, { flush: "post" });
</script>
<template>
  <section class="inspector">
    <h2>状态与事件</h2>
    <pre data-testid="migration-events">{{ migrationEvents }}</pre>
    <pre data-testid="drawer-state">{{
      {
        name: "右侧抽屉",
        visible: drawerOpen,
        mode: drawerMode,
        maximized: drawerMaximized,
        rect: snapshot.drawer,
      }
    }}</pre>
    <pre v-for="(name, i) in names" :key="name" data-testid="states">{{
      {
        name,
        visible: visible[i],
        mode: states[i]?.mode ?? "anchored",
        placement: states[i]?.placement ?? placement,
        maximized: states[i]?.maximized ?? false,
        rect: snapshot.panels[i],
      }
    }}</pre>
    <ol>
      <li v-for="(line, i) in logs" :key="i">{{ line }}</li>
    </ol>
  </section>
</template>
