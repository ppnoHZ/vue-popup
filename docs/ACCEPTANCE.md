# AC01–AC18 验收记录

日期：2026-10-27（Asia/Shanghai）。执行环境：Windows、Node 24.14.1、本机 Chrome（Chromium）、1100×800 默认视口；另测 320×568、220×150。以下为实际执行结果，不将未运行的浏览器列为通过。

| 检查          | 命令              | 结果                                        |
| ------------- | ----------------- | ------------------------------------------- |
| TypeScript    | npm run typecheck | 通过，无类型错误                            |
| ESLint        | npm run lint      | 通过，无错误、无警告                        |
| 生产构建      | npm run build     | 通过，无大文件警告                          |
| 单元/组件测试 | npm test          | 66/66 通过，5 个测试文件                    |
| 浏览器交互    | npm run test:e2e  | 30/30 通过 |

## 逐项结果

2026-10-28 无 Header 自定义拖动验收：新增 showHeader、dragHandle（选择器/HTMLElement/获取函数/false）和可选 #dragHandle 插槽，Popup/Modal/Drawer 共用。使用面板内事件委托，动态节点每次按下时解析，排除交互控件、data-no-drag 和嵌套面板。隐藏 Header 时不保留指向已移除标题的 aria-labelledby，允许业务自定义名称。单元覆盖三类来源、无效/缺失/关闭入口、插槽优先级、交互元素及嵌套隔离；Chrome Demo 回归覆盖无 Header 拖动、输入保留、句柄切换、禁用后继续缩放、放大/还原/复位/关闭。独立组件包消费同时核对新增 Props 的类型。

2026-10-28 滚动条边界复验：用根元素 clientWidth/clientHeight 替代含滚动条的 innerWidth/innerHeight。共用可用视口尺寸进行拖动、缩放、吸附、居中、停靠、放大和还原；ResizeObserver 监听根元素，在滚动条动态变化时重算并在关闭/卸载时清理。新增 3 项单元用例及独立 Chrome 经典滚动条用例；后者禁用 Playwright 默认隐藏滚动条的参数，实际验证 24px 纵向与 20px 横向滚动条、触边缩放与动态显隐。原有 28 项浏览器用例回归通过。局部锚点滚动容器不改变面板默认的视口边界契约。

2026-10-28 性能优化复验：逐指针样本计算约束，每动画帧合并视觉更新与移动事件；结束/取消同步刷新最终几何。拖动期间使用临时 translate3d，结束恢复 left/top 并清理 transform。Demo 诊断以 100ms 采样。新增 7 项单元测试和 2 项 Chrome 回归，覆盖高频合并、约束反向、取消清理与最终坐标。AC01–AC18 及原有吸附/放大/动画回归全部通过，typecheck/lint/build/pack:lib 均通过。方法、原始数据及性能限制见 [性能报告](./performance/README.md)。

2026-10-28 普通面板缩放复验：Popup/Modal 默认上限统一为视口，显式业务上限仍有效。默认启用 8 个手柄，侧边热区覆盖整条边；新增非中点抓取、Popup 全视口宽度、1600px 视口 Modal 全宽、动画中真实矩形采样的回归。Demo 原先 30 次缩放采样触发父级与全部表单重渲染 32 次；隔离 PanelDiagnostics.vue 并移除逐帧日志拼接后实测降为 2 次。新增浏览器性能回归要求 30 次采样父级更新不超过 4 次，并核对输入内容保留。原有显式限制与触限反向响应继续通过。

2026-10-28 左右缩放修复：先通过失败用例复现 ml/mr 缩放越过上限后反向移动 10px 仍无响应；改为按当前有效几何与上次指针位置增量计算，丢弃超限位移。新增 min/max 与视口边界的同手势往返测试。Drawer 默认 maxWidth 改为视口约束，显式 maxWidth 继续有效，Popup/Modal 默认 960 保留；新增 Drawer 拉至视口左右安全边界的浏览器用例。

新增边缘吸附验收：默认 16px；四边、角落、移出范围、阈值设置、关闭吸附和 keepInViewport=false 均有单元验证；浏览器额外验证四边与角落、关闭/自定义阈值及抽屉复用。吸附后尺寸不变，mode=detached，drag-end 与实际 rect 一致。吸附仅作用于标题栏拖动。

组件库另通过 `npm run pack:lib`：生成 ESM/CJS/CSS/d.ts 和 tarball，并在无 Antdv 的独立临时项目安装 tarball，验证两种模块导入及严格 TypeScript 消费。GitHub Actions 配置在 push、PR、workflow_dispatch 执行全部检查并上传组件包。

| AC   | 结果 | 自动化证据                                                                                          |
| ---- | ---- | --------------------------------------------------------------------------------------------------- |
| AC01 | 通过 | 四角逐一打开，以 boundingClientRect 验证全部位于 8px 安全边界内                                     |
| AC02 | 通过 | 容器 scrollTop 改变 50px，锚点面板 y 同步变化 50px                                                  |
| AC03 | 通过 | 标题拖动 100px，面板 x 同步变化 100px，mode=detached                                                |
| AC04 | 通过 | detached 后页面滚动，面板完整 rect 不变                                                             |
| AC05 | 通过 | 指针分别向四个方向移动 2000px，面板均保持边界                                                       |
| AC06 | 通过 | 八手柄各移动 12px，验证对应边变化及对侧边不变；单测覆盖极端位移                                     |
| AC07 | 通过 | br 缩到最小 260×180、放到有效最大；纯函数测试八方向 ±2000 位移和非负边界                            |
| AC08 | 通过 | 视口缩为 320×568 与 220×150，验证 rect 约束、关闭按钮可见                                           |
| AC09 | 通过 | 拖动后点击复位，mode=anchored 并重新检查视口定位                                                    |
| AC10 | 通过 | 缩放后关闭再打开，mode=anchored、尺寸保留；单测确认 resetSize 读取最新初始 Props                    |
| AC11 | 通过 | Ant Input 输入保留，Select 选择与日期弹层打开不关闭、不拖动；正文独立滚动；CSS 正文保留正常文本选择 |
| AC12 | 通过 | 两个面板同时打开，拖动一者另一 rect 不变；交互面板 z-index 提升                                     |
| AC13 | 通过 | 外部 v-model 关闭两个面板；组件单测验证 programmatic 关闭事件一次和监听释放                         |
| AC14 | 通过 | 浏览器打开关闭 20 次无异常；组件测试核对 20 次 open/close/dispose，交互清理测试验证结束后移动无影响 |
| AC15 | 通过 | transform + overflow:auto 容器和视口四角 trigger，面板挂载 body，不受容器边界裁剪                   |
| AC16 | 通过 | 原生按钮 Enter/Space 打开、Esc 关闭，关闭按钮键盘激活，恢复 trigger 焦点；按钮保持原生 Tab 可达     |
| AC17 | 通过 | 320×568 面板完整位于视口内；正文 overflow:auto、关闭按钮可见；额外覆盖 220×150                      |
| AC18 | 通过 | 实际移除锚点，anchored 关闭，detached 仍可关闭；20 次关闭/卸载测试未抛异常                          |

浏览器测试文件 `tests/popup.spec.ts`，组件测试 `src/components/DraggablePopup/__tests__/DraggablePopup.spec.ts`，几何测试 `geometry.spec.ts`。所有 E2E 用例统一检查 pageerror 和 console.error。还验证禁用交互、外部点击关闭、pointercancel 后不继续移动及缩放极值。测试报告由 Playwright 生成在 `playwright-report/index.html`（不纳入源码）。

## 文件清单

- 工程入口/配置：`package.json`、`package-lock.json`、`index.html`、`tsconfig.json`、`vite.config.ts`、`eslint.config.js`、`playwright.config.ts`、`.gitignore`、`src/main.ts`。
- 组件：`DraggablePopup.vue`、`types.ts`、`index.ts`、`styles.css`、`composables/geometry.ts`（均位于 `src/components/DraggablePopup/`）。
- Demo：`src/demo/App.vue`、`src/demo/useAntTheme.ts`（Ant Design Vue Design Token 到 CSS 变量的桥接）。
- 单元测试：组件目录下 `__tests__/DraggablePopup.spec.ts`、`__tests__/geometry.spec.ts`。
- E2E：`tests/popup.spec.ts`。
- 文档/截图：根 `README.md`、组件 `README.md`、本文件、`docs/demo.png`。

## 剩余限制

无已知阻塞 P0 问题。自定义 teleportTo 必须遵守浏览器 fixed 包含块约束，推荐 body 或无 transform 的顶层容器。开启外部点击关闭时，第三方二级弹层需配置归属容器。SSR、Firefox/WebKit 和移动端完整手势未验收。P1 的键盘移动缩放、磁吸停靠、持久化、受控 rect、碰撞避让未实现。

依赖安装时 npm 对间接工具依赖 `nopt/abbrev` 提示其声明支持 Node 24.15+；本环境 24.14.1 上上述检查全部实际通过。新环境建议使用较新的 Node 24 LTS。

## 抽屉与放大增量验收

- 新增 variant=drawer，打开时 docked 贴右，高度按视口计算且遵循普通 maxHeight；拖动、8 手柄缩放后进入 detached；复位恢复右侧停靠。抽屉可不提供 trigger，直接由 v-model 控制。
- Popup/抽屉共享 maximize/restore/toggleMaximize/isMaximized 方法、maximizable 属性与 maximize-change 事件。放大独立保存普通 rect，覆盖安全视口，关闭再打开恢复普通尺寸。
- 组件测试核对放大/还原事件去重、禁用放大、动态关闭能力、关闭时尺寸恢复、无 trigger 抽屉、自定义 class/style/data 属性转发、放大期间锚点移除与监听清理。
- 浏览器新增 3 个场景，验证 Popup anchored/detached 放大还原、放大时禁止拖动、小视口放大还原裁剪；右抽屉左边缩放无跳变、拖动、复位、关闭重开宽度保留；多实例与键盘放大/还原/Esc。
- 修复已有缺陷：autoUpdate 与组件直接使用同一个 updatePosition 作为 window resize 回调，退出 anchored 的清理可能移除自由模式的 resize 监听。现使用独立回调，并加入“detached→放大→320×568→还原”真实浏览器回归。
- `class/style` 现在明确转发到面板；不需要锚点的模式释放全页面 MutationObserver。放大时仅暂停锚点定位，仍检查 anchored 的锚点移除。
- 新截图：`docs/drawer.png`、`docs/maximized.png`；原有 AC01–AC18 全部回归通过。

## Ant Design Vue 样式调整复验

按后续要求，将面板和 Demo 统一为 Ant Design Vue 风格，并接入真实 Design Token。更换标题栏图标、按钮和主题样式后，重新执行 typecheck、lint、build、unit（18/18）、Chrome E2E（9/9），全部通过。`docs/demo.png` 已更新为本次样式截图。

## 动画增量验收

- 默认 motion=true、motionDuration=200ms。Popup/Modal 淡入淡出，Drawer 根据边向展开/收起，Mask 淡入淡出；开关不添加影响视口几何的 transform。
- 仅放大/还原/复位添加 left/top/width/height 过渡；指针拖动、缩放、视口约束与常规锚点更新保持直接响应。交互开始时采样真实插值几何并清理过渡。
- 关闭动画期间保留滚动锁，过渡结束后调用 afterClose/afterOpenChange 并恢复触发器焦点；快速重开取消过期完成通知。卸载清理计时器与媒体查询监听。
- 支持 motion=false、motionDuration=0；动态遵循 prefers-reduced-motion，并暂停 loading 图标旋转。
- Chrome 新增 2 项测试，检查几何过渡样式、最终坐标、拖动即时响应、减少动态效果下即时放大及关闭焦点/滚动恢复。原有 14 项场景回归通过；35 项单元测试通过，typecheck/lint/build 通过。

## Ant Design Vue API / Slots 迁移验收

- 核对实际安装的 ant-design-vue 4.2.6 Modal/Drawer 源码与声明，新增 `DraggableModal` / `DraggableDrawer` 具名入口，完整迁移矩阵见组件 `MIGRATION.md`。
- 新增 open/visible 绑定（保留 modelValue）、title/extra/footer/closeIcon/okText/cancelText 插槽、VNode/函数内容、closable/keyboard、分区样式、字符串宽高、getContainer、centered、destroyOnClose/forceRender、mask/maskClosable/maskStyle 等常用接口。
- Modal 提供默认确认/取消、confirmLoading，ok 保持受控不自动关闭；Drawer close 在关闭请求时给出原生事件；afterOpenChange 报告实际显隐变化。旧 Popup close({reason}) 保持兼容。
- Modal/Drawer 默认保留关闭后的内容并提供遮罩；多个遮罩实例共享滚动锁并在最后一个关闭后恢复。旧 Popup 的默认非模态、默认 v-model 销毁策略保持兼容。
- 单元新增 11 项：绑定优先级、插槽优先级、确认受控、loading、关闭事件、内容保留与销毁、forceRender、getContainer 与 inline、VNode、区域样式、多实例滚动锁、Drawer 四方向及动态切边。
- E2E 新增 2 项：使用真实 Ant 表单的 Modal/Drawer 迁移、字符串尺寸、footer/extra/closeIcon、loading、输入保留、原生关闭事件与遮罩；原有 12 项浏览器测试全部回归通过。
- 新增源码：`variants.ts`、`RenderContent.ts`、`composables/length.ts`、`composables/scrollLock.ts`；新增 `__tests__/ant-compat.spec.ts` 和 `MIGRATION.md`。完整焦点陷阱、Ant 静态方法、自动内容高度、push/size 等未声明为兼容，详见迁移边界。
