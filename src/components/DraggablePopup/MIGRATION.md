# 从 Ant Design Vue 迁移

基准：项目实际安装的 **ant-design-vue 4.2.6**，核对本地 `es/modal/Modal`、`es/drawer/index` 源码和类型。支持常用 API 与插槽的迁移，不宣称覆盖 Antdv 所有特性。

## 推荐入口

```vue
<script setup lang="ts">
import { ref } from "vue";
import { DraggableModal, DraggableDrawer } from "./components/DraggablePopup";
const modalOpen = ref(false);
const drawerOpen = ref(false);
function save() {
  /* 提交成功之后由业务关闭 */ modalOpen.value = false;
}
</script>

<template>
  <!-- a-modal 改为 DraggableModal，常用插槽与事件不需要改名 -->
  <DraggableModal
    v-model:open="modalOpen"
    title="配置"
    centered
    width="520px"
    @ok="save"
    @cancel="console.log('cancel')"
  >
    <template #title><strong>配置</strong></template>
    <template #closeIcon><span>×</span></template>
    <a-form><!-- 原有表单 --></a-form>
    <template #okText>提交</template>
    <template #cancelText>返回</template>
  </DraggableModal>

  <!-- a-drawer 改为 DraggableDrawer，保留 title/extra/footer/default -->
  <DraggableDrawer
    v-model:open="drawerOpen"
    title="设置"
    placement="right"
    width="420px"
    @close="console.log('close')"
  >
    <template #extra><a-button>更多操作</a-button></template>
    <a-form><!-- 原有表单 --></a-form>
    <template #footer
      ><a-button @click="drawerOpen = false">完成</a-button></template
    >
  </DraggableDrawer>
</template>
```

`DraggablePopup` 也接受以下 API。使用 `open/visible` 且没有 trigger 插槽时，自动采用 Modal 布局；提供 trigger 时仍是锚点浮层。具名 `DraggableModal`、`DraggableDrawer` 固定其布局，适合直接迁移。原有 `variant="drawer"`、默认 `v-model` 继续兼容。

## Props 对照

| Antdv 常用写法                        | 本组件支持情况                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `v-model:open`                        | 首选控制接口                                                                                                                                 |
| `v-model:visible`                     | 兼容旧版；优先级 open > visible > modelValue。只建议使用一种绑定                                                                             |
| title / footer / extra / closeIcon    | 支持 Vue 节点或返回节点的函数，同名 slot 优先；footer=null 且无 footer slot 时隐藏 footer                                                    |
| closable                              | true；只控制关闭按钮，复位/放大可独立使用                                                                                                    |
| keyboard                              | true；与旧 closeOnEsc 同时指定时 keyboard 优先                                                                                               |
| width / height                        | 支持数字、px、百分比、vw/vh、合法 CSS 长度；转换为视口像素后进入几何系统                                                                     |
| centered                              | Modal 垂直居中；默认距顶部 100px（始终受视口约束）                                                                                           |
| placement                             | Drawer 支持 top/right/bottom/left；旧锚点 Popup 仍使用 Floating UI 的 12 个方向                                                              |
| confirmLoading                        | Modal 默认确认按钮 loading、禁用重复提交                                                                                                     |
| okText / cancelText                   | 默认“确定”/“取消”，可通过同名 slot 改为节点                                                                                                  |
| okButtonProps / cancelButtonProps     | 支持 disabled、loading（boolean）、danger、class、style 子集；复杂 Ant Button 使用 footer slot                                               |
| bodyStyle / headerStyle / footerStyle | 对应区域样式                                                                                                                                 |
| rootClassName / wrapClassName         | 应用到面板；class 同样支持                                                                                                                   |
| rootStyle / drawerStyle               | 应用到面板；组件几何样式具有最终优先级                                                                                                       |
| getContainer                          | 字符串、HTMLElement、返回 HTMLElement 的函数、false；false 原地渲染                                                                          |
| destroyOnClose                        | 具名 Modal/Drawer 和 open/visible 绑定默认 false；旧 v-model 默认 true，保持已有行为                                                         |
| forceRender                           | 默认 false；true 时首次打开前也挂载内容                                                                                                      |
| mask / maskClosable / maskStyle       | 具名 Modal/Drawer 默认有 mask，maskClosable 默认 true；原 DraggablePopup 默认无 mask；有 mask 时管理 body 滚动锁，多个实例关闭最后一层才恢复 |
| afterClose                            | 关闭过渡结束后调用；motion=false 或减少动态效果时立即完成                                                                                    |

**尺寸规则差异**：width/height 是初始尺寸，不是持续受控尺寸，后续更改后调用 `resetSize()`；这是为了保留用户拖动缩放的结果。左右 Drawer 指定 height 时保留该初始高度，未指定时铺满视口；上下 Drawer 的 width 同理。所有入口默认宽高只受视口限制，支持显式 maxWidth/maxHeight 作为业务上限，不再有隐含的 960/800 上限。默认提供四边和四角全部手柄，热区覆盖整条边；可用 resizeHandles 选子集。缩放触及限制后反向移动立即响应，不累计超限位移。自由模式、放大/还原沿用已有几何规则。

## Slots 对照

| 插槽                | 说明                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| default             | 原有业务内容                                                                |
| title               | 标题；优先于 title Prop 和旧 header slot                                    |
| extra               | 标题栏扩展操作，自动排除拖动触发                                            |
| footer              | 整体底部操作区；Modal 不提供时有默认确认/取消，Drawer 不提供时不显示 footer |
| closeIcon           | 替换关闭图标，保留可访问的关闭按钮外壳                                      |
| okText / cancelText | Modal 默认按钮内容                                                          |
| trigger / header    | 既有扩展插槽，继续兼容                                                      |

## 事件语义

- `@ok(event)`：同 Modal，只请求提交，**不会自动关闭**。提交成功由业务设置 open=false。
- `@cancel(event)`：Popup/Modal 内部请求关闭时触发，同时请求更新 open/visible/modelValue。外部直接关闭不会触发 cancel。
- **具名 DraggableDrawer** `@close(event)`：同 Antdv Drawer，在关闭按钮、Esc、遮罩等请求关闭时触发，参数为原生 MouseEvent/KeyboardEvent；外部关闭不额外触发。
- **原 DraggablePopup / DraggableModal** `@close({reason})`：保留已有扩展事件，在实际变为关闭时触发。迁移 Modal 使用 `@cancel`。
- `@afterOpenChange(boolean)`、`@afterVisibleChange(boolean)`：开关过渡结束后触发；支持模板 kebab-case 写法 `@after-open-change`。减少动态效果或 motion=false 时不等待动画。
- `@change(boolean)`：内部请求改变打开状态。
- `@close-request({reason,event})`：跨入口统一的关闭请求扩展接口；原有拖动、缩放、模式和放大事件保持不变。
- 具名组件转发全部事件与公开方法；仍可通过 ref 调用 maximize/restore/resetPosition 等。

## 明确的迁移边界

`showHeader`（默认 true）、`dragHandle` 和 `#dragHandle` 是本组件的扩展接口，三个入口均支持。无 Header 场景显式使用 `showHeader=false`，指定面板内工具栏作为 `dragHandle` 或提供 `#dragHandle` 插槽；不根据 title 是否为空自动隐藏现有标题栏。隐藏后请自行提供面板的可访问名称及关闭/放大等操作，详见 README。

新增的 `snapToEdge`（默认 true）和 `snapThreshold`（默认 16px）属于拖动扩展 API，三个入口一致。标题栏拖动接近视口安全边界即吸附，保持尺寸和 detached 模式；可以关闭，也不会作用于缩放或覆盖 Antdv placement。详细规则见 README。

- 这是新增拖动/缩放/放大能力的浮动面板，并非 Antdv 源组件包装器；基础组件没有 Antdv 运行依赖。
- 尚未兼容 Modal 静态方法（confirm/info/useModal 等）、按钮完整 ButtonProps、自动内容高度、ConfigProvider locale 自动读取、Drawer push/level 联动、size、autofocus 和完整焦点陷阱。开关与几何过渡使用本组件的轻量动画，不复用 Antdv 的动画私有实现。复杂 footer 可直接放原 Ant Button。
- Mask 会锁定背景滚动，但当前不提供完整焦点陷阱；关闭后仍尽量恢复 trigger 焦点。无 trigger 时需由业务管理焦点恢复。
- 新的 width/height CSS 长度在初始化或 resetSize 时测量；不要依赖它们像原 Antdv 一样持续驱动尺寸。
- `getContainer=false` 或自定义目标位于 transform/filter/contain 等包含块内时，浏览器 fixed 包含块与裁剪规则仍然适用，推荐默认 body。
- Select/DatePicker 等二级弹层仍应通过 getPopupContainer 挂载到面板，配置方式见 README。新增 mask 时也应确保二级弹层归属当前面板。

Demo 的“Antdv Modal 迁移示例”和“Antdv Drawer 迁移示例”提供可运行的 open 绑定、插槽、保留表单内容、loading、mask 与事件示例。
