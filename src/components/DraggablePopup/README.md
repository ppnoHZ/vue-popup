# DraggablePopup

**Ant Design Vue 迁移入口**：另导出 `DraggableModal`、`DraggableDrawer`，支持 `v-model:open`（兼容 visible）、`title/extra/footer/closeIcon/okText/cancelText` 等插槽。Props、事件语义、默认值与不兼容项见 [迁移指南](./MIGRATION.md)。以下原 API 同时保留。

Vue 3.5 + TypeScript 通用非模态浮动面板。基础组件只依赖 Vue 和 `@floating-ui/vue`，不依赖 Ant Design Vue。复制此目录即可在其他 Vue 工程中使用；入口支持默认/具名导入，CSS 随组件导入。

使用构建好的 npm tarball 时，从 `vue-draggable-popup` 导入组件，并额外 `import 'vue-draggable-popup/style.css'`。`npm run pack:lib` 生成 ESM、CommonJS、类型声明和可安装的包，详见项目根 README。

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

| 属性                  | 类型                       | 默认                                               |
| --------------------- | -------------------------- | -------------------------------------------------- |
| modelValue            | boolean，兼容默认 v-model  | —                                                  |
| open / visible        | boolean，Antdv 风格绑定    | —                                                  |
| variant               | 'popup'、'drawer'、'modal' | popup（open/visible 无锚点时自动 modal）           |
| maximizable           | boolean                    | true                                               |
| title                 | string                     | Popup                                              |
| placement             | Placement                  | bottom-start                                       |
| offset                | number                     | 8                                                  |
| boundaryPadding       | number                     | 8                                                  |
| autoFlip / autoShift  | boolean                    | true / true                                        |
| width / height        | number                     | 360 / 280                                          |
| minWidth / minHeight  | number                     | 260 / 180                                          |
| maxWidth / maxHeight  | number                     | 所有入口默认仅受视口限制，显式配置时按指定上限约束 |
| draggable / resizable | boolean                    | true / true                                        |
| resizeHandles         | ResizeHandle[]             | 默认全部 8 个方向；可传 ['br'] 等子集              |
| keepInViewport        | boolean                    | true                                               |
| snapToEdge            | boolean                    | true                                               |
| snapThreshold         | number                     | 16px                                               |
| closeOnOutsideClick   | boolean                    | false                                              |
| closeOnEsc            | boolean                    | true                                               |
| teleportTo            | string 或 HTMLElement      | body                                               |
| zIndex                | number                     | 2000                                               |
| trigger               | 'click' 或 'manual'        | click                                              |

`width/height` 仅在实例初始化时读取。后续改变 Props 不覆盖用户尺寸，`resetSize()` 读取最新 Props。关闭再打开保留最近有效尺寸。视口不足时，有效最大尺寸受视口安全边距限制，有效最小尺寸随之下降；视口恢复时不会自动放大已裁剪尺寸。`keepInViewport=false` 允许自由模式位置逃离视口，适用于调用方明确需要的场景；默认开启。

## Events

| 事件                               | 参数与时机                                                       |
| ---------------------------------- | ---------------------------------------------------------------- |
| update:modelValue                  | boolean，内部请求改变显隐，调用方应通过 v-model 接受请求         |
| open                               | 无参数，实际变为打开                                             |
| close                              | `{reason: CloseReason}`，实际变为关闭，一次状态转换一次          |
| mode-change                        | `{mode: 'anchored' 或 'detached' 或 'docked'}`，实际改变模式     |
| maximize-change                    | `{maximized: boolean, rect: PopupRect}`，放大/还原实际改变时触发 |
| placement-change                   | `{placement: Placement}`，最终定位方向改变                       |
| drag-start / drag / drag-end       | PopupRect，拖动开始/移动/结束                                    |
| resize-start / resize / resize-end | PopupRect，缩放开始/移动/结束                                    |

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
| resetPosition(): void  | 结束当前交互与放大，popup 恢复 anchored，drawer 恢复 docked      |
| resetSize(): void      | 恢复最新 width/height Props，打开时重新约束                      |
| updatePosition(): void | anchored 重算定位；detached 仅约束视口                           |
| getRect(): PopupRect   | 当前或上次有效几何；首次打开前返回 x=0、y=0 和初始尺寸；返回副本 |
| maximize(): void       | 打开且 maximizable=true 时放大，重复调用无效                     |
| restore(): void        | 还原放大前的位置、尺寸和模式；视口缩小时重新约束                 |
| toggleMaximize(): void | 切换放大/还原                                                    |
| isMaximized(): boolean | 获取当前放大状态                                                 |

## 右侧抽屉与一键放大

```vue
<DraggablePopup
  ref="drawer"
  v-model="drawerOpen"
  variant="drawer"
  title="配置抽屉"
  :width="420"
  :resize-handles="['ml', 'bl', 'br']"
>
  <template #trigger><a-button>打开抽屉</a-button></template>
  <a-form><!-- 业务内容 --></a-form>
  <template #footer><a-button @click="drawer?.toggleMaximize()">放大/还原</a-button></template>
</DraggablePopup>
```

- 抽屉为同一个基础组件的 `variant='drawer'`，保持非模态、无蒙层、不锁页面滚动。支持 `trigger='manual'` + 外部 v-model，此时不需要 trigger 插槽，不会创建空的可聚焦触发器。
- 打开时为 `docked`，位于视口右侧安全边距，宽度使用配置/上次用户宽度。指定 height（例如 520）时以其为初始高度，可向上或向下调整并超出初始值；未指定时尽可能铺满视口。Drawer 默认宽高只受视口限制，不再有 960px 宽度和 800px 高度上限；显式 maxWidth/maxHeight 仍生效，最终受安全边距约束。
- 第一次拖动标题栏或缩放后变成 `detached`；八方向缩放规则与 Popup 相同。复位回右侧，关闭重开保留用户有效尺寸；未配置 height 的全高抽屉重新停靠时再次铺满视口。已经贴住视口底边时，底部手柄不能向屏幕外增长，可拖上边手柄增高，或先移动面板留出空间。
- Popup 和抽屉标题栏默认都有“放大面板/还原面板”按钮，`maximizable=false` 可关闭该能力。放大使用整个视口减 boundaryPadding，刻意不受普通 maxWidth/maxHeight 限制；不调用浏览器 Fullscreen API。
- 放大状态独立于模式，保留原始 rect 和 mode，暂停锚点定位与拖动/缩放，隐藏 resize 手柄；窗口大小改变仍同步填满安全区域。`data-maximized` 可读取当前状态。
- 还原时恢复原始 rect；anchored 重新跟随锚点，docked 重新贴右，detached 恢复原位置并按当前视口约束。放大状态关闭后重新打开，不会保留放大后的巨大尺寸。
- resetPosition/resetSize 会先退出放大，再执行复位；动态关闭 maximizable 也会还原。关闭和 Esc 规则与普通面板相同。
- 额外 `class/style/data-*` 属性会转发到实际面板，可按实例设置 `style="--dp-radius: 4px"` 等主题变量；几何仍应由组件公开 API 管理。

## 坐标与生命周期

- `position:fixed` 维护视口 CSS 坐标。Floating UI 保持 `transform:false`，使用 offset、flip、shift。拖动期间由组件暂时使用 translate3d 减少布局开销，结束时移除并写回最终 left/top；缩放仍直接更新尺寸。拖动期间面板内 fixed 后代遵循 transform 包含块规则，二级弹层推荐 Teleport 到 body。
- 每个指针样本都计算约束和反向缩放，但视觉更新与 drag/resize 事件最多每动画帧发布一次，几何未变化时不重复发布。结束或取消时同步刷新最后一个样本，再发布 end 事件；getRect() 可在下一次渲染前读取最新逻辑几何。Demo 诊断区按 100ms 采样，避免诊断文本拖慢表单交互。性能复测方法与原始数据见 [性能报告](../../../docs/performance/README.md)。
- 非放大的 anchored 时运行 `autoUpdate`，监听滚动、尺寸和布局变化；`animationFrame:true` 额外支持 transform 移动的锚点。关闭、卸载、detached、docked 或放大时释放定位监听；锚点移除观察仅在 anchored 保留（包括放大期间）。
- 独立的窗口 resize 回调不与 autoUpdate 共用引用，避免其清理时误移除自由模式的视口约束监听；视口改变会先结束正在进行的交互，再更新几何。
- 第一次开始交互时采样真实 `getBoundingClientRect()`，再切换 detached。自由浮窗不再被锚点重算覆盖。
- 8 个手柄始终保持对侧边固定，先计算有效尺寸上下界，再同步 x/y。所有 Pointer Events 属于当前指针，结束时统一清理。捕获使指针离开面板后仍可结束。
- 缩放到达最小/最大尺寸或视口边界时丢弃超限位移，每次指针采样都以当前有效 rect 为基准。反向拉动立即响应，不需要先走回超出限制的距离。所有面板默认仅受视口限制，不再有隐含的 960×800 上限；显式 maxWidth/maxHeight 仍有效。
- 默认提供四边和四角，侧边手柄覆盖整条边而非仅中点，角落独立保留，热区在边框两侧各延伸 4px。依然可用 resizeHandles 限制允许的方向。诊断区或几何预览应独立于业务表单父组件，避免在父模板每帧调用 getRect；高频 drag/resize 不宜每帧拼接并渲染整页日志。Demo 现在只记录开始/结束事件，实时几何在独立诊断组件显示。
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

### 视口边缘吸附

三个入口默认 `snapToEdge=true`、`snapThreshold=16`（视口 CSS 像素）。拖动标题栏时，距安全边界不超过阈值即贴边，角落可同时吸附两轴；移出范围继续跟随原始指针位移，不累计吸附偏移。只移动位置，不改变尺寸或切换为 docked，也不锁定吸附后的面板。`drag`/`drag-end` 和 getRect 包含吸附后的坐标。

```vue
<DraggableDrawer
  v-model:open="open"
  :height="520"
  :snap-to-edge="true"
  :snap-threshold="24"
/>
```

`:snap-to-edge="false"` 关闭。锚点跟随、缩放、放大和视口重裁剪不进行吸附；`keepInViewport=false` 时也不吸附。吸附位置遵循 boundaryPadding，不是屏幕外侧。两侧都在范围内时选择更近的一边；距离相同固定选择左/上，避免抖动。负数或非法阈值按 0 处理。Demo 有“边缘吸附”和“吸附距离”控制。

### 动画

默认 `motion=true`、`motionDuration=200`（毫秒），各入口共享。Popup/Modal 淡入淡出，Drawer 按停靠方向展开/收起，遮罩淡入淡出。放大、还原、位置/尺寸复位时平滑过渡，拖动、缩放、锚点跟随与视口裁剪不添加延迟。开关动画不使用 transform 修改面板坐标系。

可通过 `:motion="false"` 或 `:motion-duration="0"` 立即切换；自动尊重系统 `prefers-reduced-motion: reduce`，并监听其变化。关闭动画结束前保留遮罩滚动锁；afterClose/afterOpenChange 在过渡完成后通知，快速重开会取消过期回调。getRect/拖动与放大事件仍返回逻辑目标几何，动画中如需读取插值位置可使用实际面板 getBoundingClientRect()。

BEM 前缀 `.draggable-popup`。支持覆盖 `--dp-bg`、`--dp-border-color`、`--dp-radius`、`--dp-shadow`、`--dp-header-height`、`--dp-header-bg`、`--dp-text-color`。样式可在 teleport 目标祖先或全局面板选择器上设置；trigger 的祖先样式变量不会自动跨 Teleport 继承。

默认视觉参考 Ant Design Vue 4：8px 圆角、白色标题栏、16px 标题、浅色分隔线、次级浮层阴影、24px 图标操作按钮。变量优先级为 `--dp-*` 自定义覆盖 → `--ant-*` 主题变量 → Ant Design 默认色值。另支持 `--dp-primary-color`、`--dp-font-family`、`--dp-font-size`。

Ant Design Vue 4 的 Design Token 默认通过 JavaScript 提供，并不自动生成这里使用的 CSS 变量。Demo 的 `src/demo/useAntTheme.ts` 使用 `theme.useToken()` 响应式映射，例如 `colorBgElevated → --ant-color-bg-elevated`、`borderRadiusLG → --ant-border-radius-lg`、`boxShadowSecondary → --ant-box-shadow-secondary`。变量发布到文档根节点，以兼容 Teleport；卸载时恢复原值。使用 ConfigProvider 自定义主题时，在其后代调用该桥接方法即可同步实际主题值。基础组件自身无需导入 Ant Design Vue，没有桥接时使用内置默认样式。

## 适配层选型与限制

已优先安装并评估 vue-draggable-resizable 3.0.0：其交互入口使用 mousedown/touchstart，维护内部 left/right/top/bottom 状态，不能直接提供本契约的 pointercancel 生命周期。按照 PRD 允许的轻量适配方式，改为组件私有 Pointer Events 层和纯函数几何适配器，避免双重状态和定位写入。未修改第三方源码，也没有向使用者暴露库的私有 API；评估后移除了未使用的依赖。

本期面向浏览器客户端；未验收 SSR、移动端完整手势或 Firefox/WebKit。P1：键盘移动/缩放、磁吸停靠、持久化、外部受控 rect、多面板碰撞。手柄的键盘缩放尚未实现。
