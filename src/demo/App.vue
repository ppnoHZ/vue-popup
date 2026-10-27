<script setup lang="ts">
import { reactive, ref } from "vue";
import { useAntTheme } from "./useAntTheme";
import { DraggablePopup } from "../components/DraggablePopup";
import type {
  Placement,
  PopupExpose,
  PopupRect,
  ResizeHandle,
} from "../components/DraggablePopup";
const visible = reactive([false, false, false, false, false]);
useAntTheme();
const draggable = ref(true),
  resizable = ref(true),
  outside = ref(false),
  all = ref(true),
  showAnchor = ref(true);
const placement = ref<Placement>("bottom-start"),
  width = ref(360),
  height = ref(360);
const handles: ResizeHandle[] = [
  "tl",
  "tm",
  "tr",
  "mr",
  "br",
  "bm",
  "bl",
  "ml",
];
const logs = ref<string[]>([]),
  states = reactive<Record<number, Record<string, unknown>>>({});
const panels = ref<PopupExpose[]>([]),
  names = ["左上", "右上", "左下", "右下", "滚动容器"];
const form = reactive({
  name: "",
  prompt: "",
  skill: undefined,
  date: undefined,
});
function log(i: number, name: string, value?: unknown) {
  states[i] = { ...states[i], [name]: value };
  logs.value.unshift(`${i + 1} ${name} ${value ? JSON.stringify(value) : ""}`);
  logs.value = logs.value.slice(0, 30);
}
function rect(i: number, value: PopupRect) {
  log(i, "rect", value);
}
function popupContainer(trigger: HTMLElement) {
  return (trigger.closest(".draggable-popup") as HTMLElement) || document.body;
}
</script>
<template>
  <main>
    <div class="intro">
      <small>COMPONENT LAB / VUE 3 + TYPESCRIPT</small>
      <h1>DraggablePopup</h1>
      <p>锚点定位 · 自由拖动 · 八方向缩放</p>
    </div>
    <section class="controls">
      <label><input v-model="showAnchor" type="checkbox" />显示锚点</label>
      <label><input v-model="draggable" type="checkbox" />拖动</label
      ><label><input v-model="resizable" type="checkbox" />缩放</label
      ><label
        ><input
          v-model="outside"
          type="checkbox"
          data-testid="outside"
        />外部点击关闭</label
      ><label><input v-model="all" type="checkbox" />全部手柄</label>
      <label
        >Placement
        <select v-model="placement">
          <option
            v-for="p in [
              'top',
              'top-start',
              'top-end',
              'bottom',
              'bottom-start',
              'bottom-end',
              'left',
              'left-start',
              'left-end',
              'right',
              'right-start',
              'right-end',
            ]"
            :key="p"
          >
            {{ p }}
          </option>
        </select></label
      >
      <label
        >初始宽
        <input
          v-model.number="width"
          type="number"
          style="width: 70px" /></label
      ><label
        >初始高
        <input v-model.number="height" type="number" style="width: 70px"
      /></label>
      <a-button
        @click="
          visible[0] = true;
          visible[1] = true;
        "
      >
        同时打开两个
</a-button
      ><a-button @click="panels.forEach((p) => p?.resetSize())">
        恢复默认尺寸
</a-button
      ><a-button data-testid="external-close" @click="visible.fill(false)">
        外部关闭
      </a-button>
    </section>
    <div class="clip-container">
      <div class="scroll-container">
        <div class="scroll-inner">
          <p>此容器设置 transform、overflow:auto，滚动观察锚点跟随。</p>
          <Teleport
            v-for="(name, i) in names"
            :key="name"
            to="body"
            :disabled="i === 4"
          >
            <div :class="['anchor-position', `anchor-${i}`]">
              <DraggablePopup
                :ref="
                  (el) => {
                    if (el) panels[i] = el as unknown as PopupExpose;
                  }
                "
                v-model="visible[i]!"
                :title="`${name}配置`"
                :placement="placement"
                :width="width"
                :height="height"
                :draggable="draggable"
                :resizable="resizable"
                :close-on-outside-click="outside"
                :resize-handles="all ? handles : ['br']"
                @open="log(i, 'open')"
                @close="log(i, 'close', $event)"
                @mode-change="log(i, 'mode', $event.mode)"
                @placement-change="log(i, 'placement', $event.placement)"
                @drag-start="log(i, 'drag-start', $event)"
                @drag="rect(i, $event)"
                @drag-end="log(i, 'drag-end', $event)"
                @resize-start="log(i, 'resize-start', $event)"
                @resize="rect(i, $event)"
                @resize-end="log(i, 'resize-end', $event)"
              >
                <template #trigger>
                  <a-button v-if="showAnchor" :data-testid="`trigger-${i}`">
                    {{ name }}打开
                  </a-button>
                </template>
                <a-form layout="vertical">
                  <a-form-item label="名称">
                    <a-input
                      v-model:value="form.name"
                      placeholder="可正常输入与选字"
                    />
                  </a-form-item>
                  <a-form-item label="Skill">
                    <a-select
                      v-model:value="form.skill"
                      :get-popup-container="popupContainer"
                      :options="[
                        { value: 'writing', label: 'Writing' },
                        { value: 'analysis', label: 'Analysis' },
                      ]"
                      placeholder="选择技能"
                    />
                  </a-form-item>
                  <a-form-item label="日期">
                    <a-date-picker
                      v-model:value="form.date"
                      :get-popup-container="popupContainer"
                    />
                  </a-form-item>
                  <a-form-item label="Prompt">
                    <a-textarea v-model:value="form.prompt" :rows="3" />
                  </a-form-item>
                </a-form>
                <p v-for="n in 16" :key="n">
                  {{ n }} · 这里是可选中文本和独立滚动的长正文。
                </p>
                <template #footer>
                  <a-button @click="visible[i] = false">取消</a-button
                  ><a-button type="primary" @click="visible[i] = false">
                    保存
                  </a-button>
                </template>
              </DraggablePopup>
            </div>
          </Teleport>
        </div>
      </div>
    </div>
    <section class="inspector">
      <h2>状态与事件</h2>
      <pre v-for="(name, i) in names" :key="name" data-testid="states">{{
        {
          name,
          visible: visible[i],
          mode: states[i]?.mode ?? "anchored",
          placement: states[i]?.placement ?? placement,
          rect: panels[i]?.getRect(),
        }
      }}</pre>
      <ol>
        <li v-for="(line, i) in logs" :key="i">{{ line }}</li>
      </ol>
    </section>
    <p class="end">滚动页面测试锚点跟随；拖动之后面板保持视口坐标。</p>
  </main>
</template>
<style>
body {
  margin: 0;
  background: var(--ant-color-bg-layout, #f5f5f5);
  color: var(--ant-color-text, #000000e0);
  font-family: var(--ant-font-family, sans-serif);
  font-size: var(--ant-font-size, 14px);
}
main {
  padding: 80px 6vw;
  min-height: 1800px;
}
.intro {
  max-width: 800px;
  margin: 0 auto 28px;
}
.intro small {
  color: var(--ant-color-text-secondary, #000000a6);
  letter-spacing: 1px;
}
h1 {
  font-size: 30px;
  font-weight: 600;
  margin: 12px 0;
}
.controls {
  max-width: 900px;
  margin: 0 auto 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--ant-color-bg-container, #fff);
  padding: 24px;
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: var(--ant-border-radius-lg, 8px);
}
.controls label {
  display: flex;
  gap: 6px;
  align-items: center;
}
.controls input[type="checkbox"] {
  accent-color: var(--ant-color-primary, #1677ff);
  width: 16px;
  height: 16px;
  margin: 0;
}
.controls select,
.controls input[type="number"] {
  height: 32px;
  padding: 4px 11px;
  color: var(--ant-color-text);
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border, #d9d9d9);
  border-radius: var(--ant-border-radius, 6px);
  font: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.controls select:hover,
.controls input[type="number"]:hover {
  border-color: var(--ant-color-primary);
}
.controls select:focus,
.controls input[type="number"]:focus {
  outline: 0;
  border-color: var(--ant-color-primary);
  box-shadow: 0 0 0 2px var(--ant-color-primary-bg);
}
button,
select {
  cursor: pointer;
}
.anchor-position {
  z-index: 1;
}
.anchor-0 {
  position: fixed;
  top: 14px;
  left: 14px;
}
.anchor-1 {
  position: fixed;
  top: 14px;
  right: 14px;
}
.anchor-2 {
  position: fixed;
  bottom: 14px;
  left: 14px;
}
.anchor-3 {
  position: fixed;
  bottom: 14px;
  right: 14px;
}
.anchor-4 {
  margin-top: 120px;
}
.scroll-container {
  height: 250px;
  overflow: auto;
  transform: translateZ(0);
  border: 1px dashed var(--ant-color-border, #d9d9d9);
  background: var(--ant-color-bg-container, #fff);
  color: var(--ant-color-text-secondary);
  border-radius: var(--ant-border-radius-lg, 8px);
  padding: 20px;
  max-width: 900px;
  margin: auto;
}
.clip-container {
  overflow: hidden;
  max-width: 944px;
  margin: auto;
  border-radius: var(--ant-border-radius-lg, 8px);
}
.scroll-inner {
  height: 650px;
}
.scroll-inner .anchor-position:not(.anchor-4) {
  transform: none;
}
.inspector {
  max-width: 900px;
  margin: 30px auto;
  background: var(--ant-color-bg-container, #fff);
  color: var(--ant-color-text);
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: var(--ant-border-radius-lg, 8px);
  padding: 24px;
  overflow: auto;
}
.inspector pre {
  max-height: 250px;
  overflow: auto;
  background: var(--ant-color-fill-alter, #00000005);
  border-radius: var(--ant-border-radius, 6px);
  padding: 12px 16px;
}
.inspector ol {
  font: 12px monospace;
  max-height: 280px;
  overflow: auto;
}
.end {
  text-align: center;
  margin-top: 300px;
}
</style>
