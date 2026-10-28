# vue-floating-panels API

Vue 3.5+、TypeScript。安装：`npm install vue-floating-panels`。每个应用入口导入一次 `vue-floating-panels/style.css`。导出 `DraggablePopup`、`DraggableModal`、`DraggableDrawer` 和 `PopupProps`、`PopupEvents`、`PopupExpose`、`PopupRect`、`DragHandle` 等类型。三个组件共享以下基础 API；Ant Design Vue 兼容差异见 [迁移指南](../src/components/DraggablePopup/MIGRATION.md)。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { DraggablePopup } from "vue-floating-panels";
import "vue-floating-panels/style.css";
const open = ref(false);
</script>
<template>
  <DraggablePopup v-model:open="open" title="设置">
    <template #trigger><button>打开设置</button></template>
    <input aria-label="名称" />
  </DraggablePopup>
</template>
```

## Props

| 属性 | 类型 | 默认与用途 |
| --- | --- | --- |
| `open` / `visible` / `modelValue` | `boolean` | 显隐绑定；优先级依次递减，默认 false。支持 `v-model:open` 与默认 `v-model`。 |
| `variant` | `'popup' \| 'modal' \| 'drawer'` | `popup`；建议直接使用对应具名组件。 |
| `title` / `footer` / `extra` / `closeIcon` / `okText` / `cancelText` | `PanelContent`（VNode 或返回 VNode 的函数） | 标题默认 `Popup`；确认/取消文字默认 `确定`/`取消`；其他按组件入口渲染。对应插槽可覆盖。 |
| `placement` | Floating UI `Placement` | Popup 默认 `bottom-start`；Drawer 使用 `left/right/top/bottom`。 |
| `offset` / `boundaryPadding` | `number` | 均为 8px；分别控制锚点间距和视口安全边界。 |
| `autoFlip` / `autoShift` | `boolean` | 均为 true；锚点定位时翻转/避让。 |
| `anchorHiddenBehavior` | `'keep' \| 'hide' \| 'close'` | `keep`；锚点滚出可视区后保留、暂时隐藏或请求关闭。仅 anchored 生效。 |
| `width` / `height` | `number \| string` | 入口相关；初次读取，`resetSize()` 读取最新值。 |
| `minWidth` / `minHeight` | `number` | 260 / 180px。 |
| `maxWidth` / `maxHeight` | `number` | 默认仅受视口约束；显式传入时生效。 |
| `draggable` / `resizable` | `boolean` | 均为 true。 |
| `showHeader` | `boolean` | true；false 隐藏标题栏及内置按钮。自行提供 `aria-label`、关闭等操作。 |
| `dragHandle` | `string \| HTMLElement \| (() => HTMLElement \| null \| undefined) \| false` | 未指定时优先 `#dragHandle` 插槽，否则标题栏；false 禁用拖动入口。只能指向当前面板内元素。 |
| `resizeHandles` | `ResizeHandle[]` | `tl,tm,tr,mr,br,bm,bl,ml`，八方向。 |
| `keepInViewport` / `snapToEdge` | `boolean` | 均为 true。 |
| `snapThreshold` | `number` | 16px；拖动到视口边缘时吸附。 |
| `maximizable` | `boolean` | true；标题栏显示放大/还原按钮。 |
| `motion` / `motionDuration` | `boolean` / `number` | true / 200ms；遵循减少动态效果设置。 |
| `closable` / `keyboard` / `closeOnEsc` | `boolean` | true / 未指定 / true；关闭按钮与 Escape 控制。 |
| `closeOnOutsideClick` | `boolean` | false。 |
| `mask` / `maskClosable` | `boolean` | 基础 Popup 为 false / true；Modal、Drawer 默认带遮罩。 |
| `maskStyle` / `rootStyle` / `drawerStyle` / `bodyStyle` / `headerStyle` / `footerStyle` | `CSSProperties` | 可覆盖对应区域样式。 |
| `rootClassName` / `wrapClassName` | `string` | 添加面板 CSS 类。 |
| `centered` | `boolean` | false；Modal 居中选项。 |
| `destroyOnClose` / `forceRender` | `boolean` | 入口相关 / false；控制关闭后内容挂载。 |
| `getContainer` / `teleportTo` | `string \| HTMLElement \| false \| (() => HTMLElement)` / `string \| HTMLElement` | getContainer 未指定；默认 Teleport 到 `body`。 |
| `zIndex` | `number` | 2000。 |
| `trigger` | `'click' \| 'manual'` | `click`；manual 由外部控制打开。 |
| `confirmLoading` | `boolean` | false；Modal 确认按钮加载态。 |
| `okButtonProps` / `cancelButtonProps` | `PanelButtonProps` | 可设 disabled、loading、danger、class、style。 |
| `afterClose` | `() => void` | 关闭过渡完成回调。 |

尺寸和坐标使用视口 CSS 像素。关闭再打开保留用户调整的有效尺寸；`resetPosition()` 恢复锚点或停靠位置，`resetSize()` 恢复最新尺寸 Props。放大暂时禁止拖动和缩放。页面滚动条宽高从可用视口扣除。自定义拖动句柄应设置 `cursor: move; touch-action: none`。

## 事件

| 事件 | 参数 / 时机 |
| --- | --- |
| `update:open` / `update:visible` / `update:modelValue` | `boolean`，内部请求显隐变化；调用方更新受控值。 |
| `change` | `boolean`，请求显隐变化。 |
| `open` / `close` | 打开无参数；基础 Popup 关闭时传 `{ reason: CloseReason }`。Drawer 的 `close` 为 Antdv 风格关闭请求原生事件，详见迁移指南。 |
| `close-request` | `{ reason, event? }`，关闭请求；`anchor-hidden` 表示锚点滚出可视区。 |
| `afterOpenChange` / `afterVisibleChange` | `boolean`，开关过渡完成。 |
| `ok` / `cancel` | 原生鼠标/键盘事件，Modal 操作。 |
| `mode-change` | `{ mode: 'anchored' \| 'detached' \| 'docked' \| 'centered' }`。 |
| `placement-change` | `{ placement: Placement }`。 |
| `maximize-change` | `{ maximized: boolean, rect: PopupRect }`。 |
| `drag-start` / `drag` / `drag-end` | `PopupRect`；移动事件最多每动画帧一次，结束同步提交最终坐标。 |
| `resize-start` / `resize` / `resize-end` | `PopupRect`；移动事件最多每动画帧一次，结束同步提交最终尺寸。 |

`PopupRect = { x: number; y: number; width: number; height: number }`。`CloseReason`：`trigger`、`close-button`、`outside`、`escape`、`programmatic`、`anchor-removed`、`anchor-hidden`。

## 插槽和方法

| 插槽 | 用途 |
| --- | --- |
| `trigger` | Popup 锚点，可放按钮。 |
| `title` / `header` | 标题内容；保留内置操作按钮。 |
| `extra` | 标题栏附加操作。 |
| `default` | 面板正文。 |
| `footer` | 底部操作区。 |
| `dragHandle` | 独立拖动条，优先于默认标题栏；禁用拖动或面板放大时不渲染，避免保留无效热区。 |
| `closeIcon` / `okText` / `cancelText` | 覆盖对应内容。 |

通过 `ref<PopupExpose>()` 调用：`getRect()`、`updatePosition()`、`resetPosition()`、`resetSize()`、`maximize()`、`restore()`、`toggleMaximize()`、`isMaximized()`。所有方法均无参数；`getRect()` 返回当前逻辑矩形，`isMaximized()` 返回 boolean。

```vue
<DraggableDrawer v-model:open="open" :show-header="false" drag-handle=".toolbar" aria-label="编辑配置">
  <div class="toolbar">拖动面板</div>
  <a-form>...</a-form>
</DraggableDrawer>
```

基础组件不依赖 Ant Design Vue；示例中的 `a-form` 仅演示业务内容。对照 Antdv Modal/Drawer 迁移时，参阅 [兼容矩阵](../src/components/DraggablePopup/MIGRATION.md)。
