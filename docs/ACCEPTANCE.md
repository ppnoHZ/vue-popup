# AC01–AC18 验收记录

日期：2026-10-27（Asia/Shanghai）。执行环境：Windows、Node 24.14.1、本机 Chrome（Chromium）、1100×800 默认视口；另测 320×568、220×150。以下为实际执行结果，不将未运行的浏览器列为通过。

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| TypeScript | npm run typecheck | 通过，无类型错误 |
| ESLint | npm run lint | 通过，无错误、无警告 |
| 生产构建 | npm run build | 通过，无大文件警告 |
| 单元/组件测试 | npm test | 18/18 通过，2 个测试文件 |
| 浏览器交互 | npm run test:e2e | 9/9 通过，页面异常与 console.error 均为空 |

## 逐项结果

| AC | 结果 | 自动化证据 |
| --- | --- | --- |
| AC01 | 通过 | 四角逐一打开，以 boundingClientRect 验证全部位于 8px 安全边界内 |
| AC02 | 通过 | 容器 scrollTop 改变 50px，锚点面板 y 同步变化 50px |
| AC03 | 通过 | 标题拖动 100px，面板 x 同步变化 100px，mode=detached |
| AC04 | 通过 | detached 后页面滚动，面板完整 rect 不变 |
| AC05 | 通过 | 指针分别向四个方向移动 2000px，面板均保持边界 |
| AC06 | 通过 | 八手柄各移动 12px，验证对应边变化及对侧边不变；单测覆盖极端位移 |
| AC07 | 通过 | br 缩到最小 260×180、放到有效最大；纯函数测试八方向 ±2000 位移和非负边界 |
| AC08 | 通过 | 视口缩为 320×568 与 220×150，验证 rect 约束、关闭按钮可见 |
| AC09 | 通过 | 拖动后点击复位，mode=anchored 并重新检查视口定位 |
| AC10 | 通过 | 缩放后关闭再打开，mode=anchored、尺寸保留；单测确认 resetSize 读取最新初始 Props |
| AC11 | 通过 | Ant Input 输入保留，Select 选择与日期弹层打开不关闭、不拖动；正文独立滚动；CSS 正文保留正常文本选择 |
| AC12 | 通过 | 两个面板同时打开，拖动一者另一 rect 不变；交互面板 z-index 提升 |
| AC13 | 通过 | 外部 v-model 关闭两个面板；组件单测验证 programmatic 关闭事件一次和监听释放 |
| AC14 | 通过 | 浏览器打开关闭 20 次无异常；组件测试核对 20 次 open/close/dispose，交互清理测试验证结束后移动无影响 |
| AC15 | 通过 | transform + overflow:auto 容器和视口四角 trigger，面板挂载 body，不受容器边界裁剪 |
| AC16 | 通过 | 原生按钮 Enter/Space 打开、Esc 关闭，关闭按钮键盘激活，恢复 trigger 焦点；按钮保持原生 Tab 可达 |
| AC17 | 通过 | 320×568 面板完整位于视口内；正文 overflow:auto、关闭按钮可见；额外覆盖 220×150 |
| AC18 | 通过 | 实际移除锚点，anchored 关闭，detached 仍可关闭；20 次关闭/卸载测试未抛异常 |

浏览器测试文件 `tests/popup.spec.ts`，组件测试 `src/components/DraggablePopup/__tests__/DraggablePopup.spec.ts`，几何测试 `geometry.spec.ts`。所有 E2E 用例统一检查 pageerror 和 console.error。还验证禁用交互、外部点击关闭、pointercancel 后不继续移动及缩放极值。测试报告由 Playwright 生成在 `playwright-report/index.html`（不纳入源码）。

## 文件清单

- 工程入口/配置：`package.json`、`package-lock.json`、`index.html`、`tsconfig.json`、`vite.config.ts`、`eslint.config.js`、`playwright.config.ts`、`.gitignore`、`src/main.ts`。
- 组件：`DraggablePopup.vue`、`types.ts`、`index.ts`、`styles.css`、`composables/geometry.ts`（均位于 `src/components/DraggablePopup/`）。
- Demo：`src/demo/App.vue`、`src/demo/useAntTheme.ts`（Ant Design Vue Design Token 到 CSS 变量的桥接）。
- 单元测试：组件目录下 `__tests__/DraggablePopup.spec.ts`、`__tests__/geometry.spec.ts`。
- E2E：`tests/popup.spec.ts`。
- 文档/截图：根 `README.md`、组件 `README.md`、本文件、`docs/demo.png`。

## 剩余限制

无已知阻塞 P0 问题。自定义 teleportTo 必须遵守浏览器 fixed 包含块约束，推荐 body 或无 transform 的顶层容器。开启外部点击关闭时，第三方二级弹层需配置归属容器。SSR、Firefox/WebKit 和移动端完整手势未验收。P1 的键盘移动缩放、停靠、持久化、受控 rect、碰撞避让、动画未实现。

依赖安装时 npm 对间接工具依赖 `nopt/abbrev` 提示其声明支持 Node 24.15+；本环境 24.14.1 上上述检查全部实际通过。新环境建议使用较新的 Node 24 LTS。

## Ant Design Vue 样式调整复验

按后续要求，将面板和 Demo 统一为 Ant Design Vue 风格，并接入真实 Design Token。更换标题栏图标、按钮和主题样式后，重新执行 typecheck、lint、build、unit（18/18）、Chrome E2E（9/9），全部通过。`docs/demo.png` 已更新为本次样式截图。
