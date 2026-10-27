<script setup lang="ts">
import type { PopupExpose } from "../components/DraggablePopup";
defineProps<{
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
        rect: drawer?.getRect(),
      }
    }}</pre>
    <pre v-for="(name, i) in names" :key="name" data-testid="states">{{
      {
        name,
        visible: visible[i],
        mode: states[i]?.mode ?? "anchored",
        placement: states[i]?.placement ?? placement,
        maximized: states[i]?.maximized ?? false,
        rect: panels[i]?.getRect(),
      }
    }}</pre>
    <ol>
      <li v-for="(line, i) in logs" :key="i">{{ line }}</li>
    </ol>
  </section>
</template>
