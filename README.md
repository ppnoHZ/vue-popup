# vue-floating-panels

Vue 3.5 + TypeScript 非模态浮动面板：锚点弹窗 `DraggablePopup`、居中模态框 `DraggableModal`、停靠抽屉 `DraggableDrawer`。支持拖动、八方向缩放、放大/还原、边缘吸附。基础组件仅依赖 Vue 与 `@floating-ui/vue`，不依赖 Ant Design Vue（仅 Demo 使用）。

[![npm](https://img.shields.io/npm/v/vue-floating-panels)](https://www.npmjs.com/package/vue-floating-panels)

## 安装

```sh
npm install vue-floating-panels
```

## 快速开始

```vue
<script setup lang="ts">
import { ref } from "vue";
import { DraggableDrawer, type PopupExpose } from "vue-floating-panels";
import "vue-floating-panels/style.css";

const open = ref(false);
const drawer = ref<PopupExpose>();
</script>

<template>
  <button @click="open = true">打开抽屉</button>
  <DraggableDrawer ref="drawer" v-model:open="open" title="配置" :width="420">
    <p>可拖动、缩放；标题栏可放大和还原。</p>
    <template #footer><button @click="open = false">关闭</button></template>
  </DraggableDrawer>
</template>
```

锚点弹窗（`v-model` + `trigger` 插槽）：

```vue
<DraggablePopup
  v-model="open"
  title="配置"
  :resize-handles="['br', 'mr', 'bm']"
>
  <template #trigger><button>打开配置</button></template>
  <label>名称 <input /></label>
  <template #footer><button @click="open = false">保存</button></template>
</DraggablePopup>
```

`DraggableModal` / `DraggableDrawer` 面向 Ant Design Vue 迁移：支持 `v-model:open`（兼容 `visible`）、`title/extra/footer/closeIcon/okText/cancelText` 等插槽，差异见[迁移指南](https://github.com/ppnoHZ/vue-popup/blob/main/src/components/DraggablePopup/MIGRATION.md)。

## Props

`Placement` 为 Floating UI 的 12 种方向；`ResizeHandle` 为 `tl | tm | tr | mr | br | bm | bl | ml`。

| 属性                    | 类型                             | 默认                                     |
| ----------------------- | -------------------------------- | ---------------------------------------- |
| modelValue              | boolean                          | —                                        |
| open / visible          | boolean，Antdv 风格绑定          | —                                        |
| variant                 | 'popup'、'drawer'、'modal'       | popup（open/visible 无锚点时自动 modal） |
| title                   | string                           | Popup                                    |
| showHeader              | boolean                          | true                                     |
| dragHandle              | string、HTMLElement、函数、false | 内置 Header                              |
| maximizable             | boolean                          | true                                     |
| placement               | Placement                        | bottom-start                             |
| offset                  | number                           | 8                                        |
| boundaryPadding         | number                           | 8                                        |
| autoFlip / autoShift    | boolean                          | true / true                              |
| width / height          | number                           | 360 / 280                                |
| minWidth / minHeight    | number                           | 260 / 180                                |
| maxWidth / maxHeight    | number                           | 仅受视口限制，显式配置时按上限约束       |
| draggable / resizable   | boolean                          | true / true                              |
| resizeHandles           | ResizeHandle[]                   | 全部 8 个方向                            |
| keepInViewport          | boolean                          | true                                     |
| snapToEdge              | boolean                          | true                                     |
| snapThreshold           | number                           | 16（px）                                 |
| anchorHiddenBehavior    | 'keep'、'hide'、'close'          | keep                                     |
| closeOnOutsideClick     | boolean                          | false                                    |
| closeOnEsc              | boolean                          | true                                     |
| motion / motionDuration | boolean / number                 | true / 200（ms）                         |
| teleportTo              | string 或 HTMLElement            | body                                     |
| zIndex                  | number                           | 2000                                     |
| trigger                 | 'click' 或 'manual'              | click                                    |

- `width/height` 仅初始化时读取；后续修改 Props 不覆盖用户尺寸，`resetSize()` 读取最新值。关闭再打开保留最近有效尺寸。
- 视口不足时有效最大尺寸受安全边距限制；视口恢复时不自动放大已裁剪尺寸。
- `keepInViewport=false` 允许自由模式位置离开视口。

完整类型见 [API 参考](https://github.com/ppnoHZ/vue-popup/blob/main/docs/API.md)。

## Events

| 事件                               | 参数与时机                                         |
| ---------------------------------- | -------------------------------------------------- |
| update:modelValue                  | boolean，内部请求改变显隐，调用方通过 v-model 接受 |
| open                               | 实际变为打开                                       |
| close                              | `{reason: CloseReason}`，实际变为关闭              |
| mode-change                        | `{mode: 'anchored' \| 'detached' \| 'docked'}`     |
| maximize-change                    | `{maximized, rect}`                                |
| placement-change                   | `{placement}`，最终定位方向改变                    |
| drag-start / drag / drag-end       | PopupRect                                          |
| resize-start / resize / resize-end | PopupRect                                          |

```ts
type CloseReason =
  | "trigger"
  | "close-button"
  | "outside"
  | "escape"
  | "programmatic"
  | "anchor-removed"
  | "anchor-hidden";
interface PopupRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

几何值为视口 CSS 像素；每次交互只发射一次 end。模式与方向也可从面板 DOM 的 `data-mode`、`data-placement`、`data-maximized` 读取。

## Slots 与公开方法

| Slot       | 说明                                     |
| ---------- | ---------------------------------------- |
| trigger    | 锚点；manual 模式仅定位                  |
| header     | 自定义标题内容，复位与关闭按钮仍保留     |
| dragHandle | 独立拖动条，渲染于标题栏之后、内容区之前 |
| default    | 可滚动正文                               |
| footer     | 固定底部操作区                           |

标题栏中的自定义交互元素请使用原生 button/input 或 `[data-no-drag]` 标记，避免触发拖动。

| 方法                   | 说明                                              |
| ---------------------- | ------------------------------------------------- |
| resetPosition()        | 退出放大，popup 恢复 anchored，drawer 恢复 docked |
| resetSize()            | 恢复最新 width/height Props                       |
| updatePosition()       | anchored 重算定位；detached 仅约束视口            |
| getRect()              | 当前或上次有效几何（副本）                        |
| maximize() / restore() | 放大 / 还原                                       |
| toggleMaximize()       | 切换放大状态                                      |
| isMaximized()          | 当前是否放大                                      |

## 功能说明

### 抽屉与放大

- 抽屉是 `variant="drawer"`：非模态、无蒙层、不锁滚动。打开时为 `docked`，贴视口右侧；首次拖动或缩放后变为 `detached`，复位回右侧。
- 指定 `height`（如 `:height="520"`）作为初始高度，可增可减；未指定则铺满视口。宽高默认仅受视口限制，显式 `maxWidth/maxHeight` 仍生效。
- 标题栏默认有“放大/还原”按钮（`maximizable=false` 关闭）。放大占满视口减 `boundaryPadding`，不使用浏览器 Fullscreen API，还原恢复原位置、尺寸与模式；关闭重开不保留放大尺寸。
- 额外的 `class/style/data-*` 会转发到面板，可按实例设置 `style="--dp-radius: 4px"`。

### 缩放

默认提供四边与四角手柄，可用 `resizeHandles` 限制。到达最小/最大尺寸或视口边界时丢弃超限位移，反向拉动立即响应；缩放期间高亮分隔线并锁定光标。可用 `--dp-resize-color` 改色。

### 视口边缘吸附

`snapToEdge`（默认开）与 `snapThreshold`（默认 16px）：拖动时距安全边界不超过阈值即贴边，角落可双轴吸附；只移动位置，不改变尺寸，拖离后继续自由移动。缩放、放大和 `keepInViewport=false` 时不吸附。

```vue
<DraggableDrawer
  v-model:open="open"
  :height="520"
  :snap-to-edge="true"
  :snap-threshold="24"
/>
```

### 无 Header 与自定义拖动入口

`:show-header="false"` 隐藏内置标题栏（请用 `aria-label` / `aria-labelledby` 命名面板）。`dragHandle` 可为选择器、元素或返回元素的函数；`false` 关闭所有拖动入口（缩放仍可用）。选择器仅在面板内匹配，未匹配时不会回退到整个内容区。

```vue
<DraggableDrawer
  v-model:open="open"
  :show-header="false"
  drag-handle="[data-drag-handle]"
  aria-label="编辑配置"
>
  <div data-drag-handle class="custom-drag-handle">⠿ 拖动面板</div>
  <template #footer><button @click="open = false">关闭</button></template>
</DraggableDrawer>
```

自定义句柄请设置 `cursor: move; touch-action: none;`。也可用无参数的 `#dragHandle` 插槽，包装层自动处理光标与 `touch-action`。按钮、输入框、链接、`role=button`、可编辑内容和 `[data-no-drag]` 不触发拖动。

### 锚点滚出视口

`anchorHiddenBehavior`：`keep`（默认）保持；`hide` 暂时隐藏并在锚点重新可见时恢复；`close` 以 `anchor-hidden` 请求关闭。仅对未放大的 anchored 面板生效，基于 IntersectionObserver，不检测被其他元素遮挡。

### 动画

默认 `motion=true`、`motionDuration=200`。Popup/Modal 淡入淡出，Drawer 按停靠方向展开，放大/还原/复位平滑过渡；拖动、缩放与锚点跟随无延迟。`:motion="false"` 关闭，自动尊重 `prefers-reduced-motion`。

### 坐标与生命周期

- 使用 `position:fixed` 与视口坐标；边界按 `document.documentElement.clientWidth/clientHeight` 并扣除滚动条。
- 默认 Teleport 到 `body`，避开祖先 transform/overflow 裁剪；自定义 `teleportTo` 目标须无 transform/filter/perspective/contain。
- 多实例按 DOM 层级确定层叠，仅最上层响应 Esc。
- 锚点元素被移除时请求 `anchor-removed` 关闭；detached 保持打开。

## Ant Design Vue 集成

面板不加遮罩、不锁滚动、不抢焦点。开启 `closeOnOutsideClick` 时，二级弹层需挂载到面板内：

```ts
const getPopupContainer = (trigger: HTMLElement) =>
  (trigger.closest(".draggable-popup") as HTMLElement) || document.body;
```

```vue
<a-select :get-popup-container="getPopupContainer" :options="options" />
<a-date-picker :get-popup-container="getPopupContainer" />
```

## 样式

BEM 前缀 `.draggable-popup`。可覆盖 `--dp-bg`、`--dp-border-color`、`--dp-radius`、`--dp-shadow`、`--dp-header-height`、`--dp-header-bg`、`--dp-text-color`、`--dp-primary-color`、`--dp-font-family`、`--dp-font-size`。优先级：`--dp-*` → `--ant-*` → 内置默认值。变量需设置在 Teleport 目标的祖先或全局选择器上。

Ant Design Vue 4 的 Design Token 不自动生成 CSS 变量；Demo 的 `src/demo/useAntTheme.ts` 演示了如何用 `theme.useToken()` 映射为 `--ant-*` 变量。

## 限制

面向浏览器客户端；未验收 SSR、移动端完整手势及 Firefox/WebKit。暂未实现键盘移动/缩放、位置持久化、受控 rect。

## 开发

```sh
npm ci
npm run dev -- --port 5187 --strictPort   # Demo: http://127.0.0.1:5187/examples/draggable-popup
npm run typecheck && npm run lint && npm test
npm run test:e2e      # 默认使用本机 Chrome；否则 npx playwright install chromium 后设置 PW_CHANNEL=chromium
npm run build         # 构建 Demo
npm run pack:lib      # 构建、校验并打包组件库（lib/ 与 tgz，不提交）
```

验收结果见 [ACCEPTANCE.md](https://github.com/ppnoHZ/vue-popup/blob/main/docs/ACCEPTANCE.md)，性能报告见 [performance](https://github.com/ppnoHZ/vue-popup/blob/main/docs/performance/README.md)。

## 发布

`.github/workflows/component-build.yml` 在 push/PR 上执行类型检查、Lint、单元测试、E2E、构建与打包，并上传 tarball Artifact。

`.github/workflows/npm-publish.yml` 仅允许从 `main` 手动发布，使用 npm Trusted Publishing（GitHub OIDC）与 provenance。首次使用需在 npm 的 Trusted Publisher 中配置用户 `ppnoHZ`、仓库 `vue-popup`、工作流 `npm-publish.yml`。步骤：

1. `npm version patch --no-git-tag-version`，提交并推送到 `main`。
2. 在 GitHub `Actions → Publish npm package → Run workflow`，输入与 `package.json` 一致的版本和 dist-tag。
3. 先用 `dry_run=true` 检查，再取消 dry-run 正式发布。
