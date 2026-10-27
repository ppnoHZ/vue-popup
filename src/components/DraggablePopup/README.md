# DraggablePopup

Vue 3.5 + TypeScript 通用非模态浮动面板。基础组件只依赖 Vue 和 `@floating-ui/vue`，不依赖 Ant Design Vue。复制此目录即可在其他 Vue 工程中使用；入口支持默认/具名导入，CSS 随组件导入。

```sh
npm install vue @floating-ui/vue
```

```vue
<script setup lang="ts">
import { ref } from "vue";
import { DraggablePopup, type PopupExpose } from "./components/DraggablePopup";
const open = ref(false);
const popup = ref<PopupExpose>();
</script>

<template>
  <DraggablePopup
    ref="popup"
    v-model="open"
    title="配置"
    :resize-handles="['br', 'mr', 'bm']"
  >
    <template #trigger><button>打开配置</button></template>
    <label>名称 <input /></label>
    <template #footer><button @click="open = false">保存</button></template>
  </DraggablePopup>
</template>
```

## Props

完整类型见 `types.ts`。`Placement` 为 Floating UI 的 12 种方向；`ResizeHandle` 为 `tl | tm | tr | mr | br | bm | bl | ml`。

| 属性                  | 类型                  | 默认         |
| --------------------- | --------------------- | ------------ |
| modelValue            | boolean，必填         | —            |
| title                 | string                | Popup        |
| placement             | Placement             | bottom-start |
| offset                | number                | 8            |
| boundaryPadding       | number                | 8            |
| autoFlip / autoShift  | boolean               | true / true  |
| width / height        | number                | 360 / 280    |
| minWidth / minHeight  | number                | 260 / 180    |
| maxWidth / maxHeight  | number                | 960 / 800    |
| draggable / resizable | boolean               | true / true  |
| resizeHandles         | ResizeHandle[]        | ['br']       |
| keepInViewport        | boolean               | true         |
| closeOnOutsideClick   | boolean               | false        |
| closeOnEsc            | boolean               | true         |
| teleportTo            | string 或 HTMLElement | body         |
| zIndex                | number                | 2000         |
| trigger               | 'click' 或 'manual'   | click        |

`width/height` 仅在实例初始化时读取。后续改变 Props 不覆盖用户尺寸，`resetSize()` 读取最新 Props。关闭再打开保留最近有效尺寸。视口不足时，有效最大尺寸受视口安全边距限制，有效最小尺寸随之下降；视口恢复时不会自动放大已裁剪尺寸。`keepInViewport=false` 允许自由模式位置逃离视口，适用于调用方明确需要的场景；默认开启。

## Events

| 事件                               | 参数与时机                                               |
| ---------------------------------- | -------------------------------------------------------- |
| update:modelValue                  | boolean，内部请求改变显隐，调用方应通过 v-model 接受请求 |
| open                               | 无参数，实际变为打开                                     |
| close                              | `{reason: CloseReason}`，实际变为关闭，一次状态转换一次  |
| mode-change                        | `{mode: 'anchored' 或 'detached'}`，实际改变模式         |
| placement-change                   | `{placement: Placement}`，最终定位方向改变               |
| drag-start / drag / drag-end       | PopupRect，拖动开始/移动/结束                            |
| resize-start / resize / resize-end | PopupRect，缩放开始/移动/结束                            |

```ts
type CloseReason =
  | "trigger"
  | "close-button"
  | "outside"
  | "escape"
  | "programmatic"
  | "anchor-removed";
interface PopupRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

所有几何值为视口 CSS 像素。pointerup、pointercancel、失去捕获、窗口失焦、交互中关闭/卸载均清理交互，并且只发射一次 end。模式和最终方向也可从面板 DOM 的 `data-mode`、`data-placement` 读取。`placement-change` 不会因无变化的重新计算重复触发。

## Slots 与公开方法

| Slot    | 说明                                                       |
| ------- | ---------------------------------------------------------- |
| trigger | 锚点，可放原生按钮或渲染按钮的 Vue 组件；manual 模式仅定位 |
| header  | 自定义标题内容；内置复位与关闭按钮仍然保留                 |
| default | 可滚动正文                                                 |
| footer  | 固定底部操作区域                                           |

插槽没有作用域参数。标题栏自定义交互内容使用原生 button/input 等元素或 `[data-no-drag]` 标记，避免启动拖动。

| 方法                   | 说明                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| resetPosition(): void  | 结束当前交互，恢复 anchored 并重新定位                           |
| resetSize(): void      | 恢复最新 width/height Props，打开时重新约束                      |
| updatePosition(): void | anchored 重算定位；detached 仅约束视口                           |
| getRect(): PopupRect   | 当前或上次有效几何；首次打开前返回 x=0、y=0 和初始尺寸；返回副本 |

## 坐标与生命周期

- `position:fixed` 和唯一的 left/top/width/height 写入者维护视口 CSS 坐标。Floating UI `transform:false`，使用 offset、flip、shift，尺寸由独立几何函数约束，避免两套 transform 叠加。
- anchored 时运行 `autoUpdate`，监听滚动、尺寸和布局变化；`animationFrame:true` 额外支持 transform 移动的锚点。关闭、卸载或 detached 时释放监听。
- 第一次开始交互时采样真实 `getBoundingClientRect()`，再切换 detached。自由浮窗不再被锚点重算覆盖。
- 8 个手柄始终保持对侧边固定，先计算有效尺寸上下界，再同步 x/y。所有 Pointer Events 属于当前指针，结束时统一清理。捕获使指针离开面板后仍可结束。
- 多实例从当前 DOM 层级计算活动层级，不依赖全局可变计数器。只有最上层面板响应 Esc。
- 默认 Teleport 到 body，逃离 trigger 祖先的 transform 和 overflow 裁剪。自定义 teleportTo 目标应放在无 transform/filter/perspective/contain 固定定位包含块的顶层节点内，否则浏览器 fixed 包含块规则仍适用。
- 锚点模式移除实际 trigger 元素时请求 `anchor-removed` 关闭；detached 保持打开。通过 v-if 卸载整个组件时会直接清理。

## Ant Design Vue

正文表单正常输入、选字和滚动；面板不添加遮罩、不锁滚动、不强制聚焦或困住焦点。原生 trigger 支持 Enter/Space；普通非交互 slot 由 wrapper 提供键盘激活。关闭后尽量恢复 trigger 焦点。

外部点击默认关闭功能禁用。开启后，二级弹层需挂载到面板，不能统一对白名单里的所有 Ant 弹层放行：

```ts
const getPopupContainer = (trigger: HTMLElement) =>
  (trigger.closest(".draggable-popup") as HTMLElement) || document.body;
```

```vue
<a-select :get-popup-container="getPopupContainer" :options="options" />
<a-date-picker :get-popup-container="getPopupContainer" />
```

面板本身不裁剪 overflow，只有 body 滚动。挂载到面板而非滚动 body，可防止二级弹层被正文裁剪，且外部点击通过 composedPath 正确识别归属。对于其他 UI 库，同样需配置弹层归属。

## 样式

BEM 前缀 `.draggable-popup`。支持覆盖 `--dp-bg`、`--dp-border-color`、`--dp-radius`、`--dp-shadow`、`--dp-header-height`、`--dp-header-bg`、`--dp-text-color`。样式可在 teleport 目标祖先或全局面板选择器上设置；trigger 的祖先样式变量不会自动跨 Teleport 继承。

默认视觉参考 Ant Design Vue 4：8px 圆角、白色标题栏、16px 标题、浅色分隔线、次级浮层阴影、24px 图标操作按钮。变量优先级为 `--dp-*` 自定义覆盖 → `--ant-*` 主题变量 → Ant Design 默认色值。另支持 `--dp-primary-color`、`--dp-font-family`、`--dp-font-size`。

Ant Design Vue 4 的 Design Token 默认通过 JavaScript 提供，并不自动生成这里使用的 CSS 变量。Demo 的 `src/demo/useAntTheme.ts` 使用 `theme.useToken()` 响应式映射，例如 `colorBgElevated → --ant-color-bg-elevated`、`borderRadiusLG → --ant-border-radius-lg`、`boxShadowSecondary → --ant-box-shadow-secondary`。变量发布到文档根节点，以兼容 Teleport；卸载时恢复原值。使用 ConfigProvider 自定义主题时，在其后代调用该桥接方法即可同步实际主题值。基础组件自身无需导入 Ant Design Vue，没有桥接时使用内置默认样式。

## 适配层选型与限制

已优先安装并评估 vue-draggable-resizable 3.0.0：其交互入口使用 mousedown/touchstart，维护内部 left/right/top/bottom 状态，不能直接提供本契约的 pointercancel 生命周期。按照 PRD 允许的轻量适配方式，改为组件私有 Pointer Events 层和纯函数几何适配器，避免双重状态和定位写入。未修改第三方源码，也没有向使用者暴露库的私有 API；评估后移除了未使用的依赖。

本期面向浏览器客户端；未验收 SSR、移动端完整手势或 Firefox/WebKit。P1：键盘移动/缩放、磁吸停靠、持久化、外部受控 rect、多面板碰撞与动画。手柄的键盘缩放尚未实现。
