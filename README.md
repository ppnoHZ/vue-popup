# Vue DraggablePopup

所有面板默认支持四边和四角缩放，宽高仅受视口安全边界限制；业务上限可显式配置 maxWidth/maxHeight。触限后反向拉动立即响应。Demo 将实时诊断区隔离为独立组件，避免连续缩放时反复重绘整页 Antdv 表单。

支持视口边缘吸附（默认 16px），可通过 `snapToEdge` / `snapThreshold` 配置；Demo 提供开关和吸附距离输入框。边缘及角落吸附不改变窗口尺寸，拖离边缘可继续自由移动。

## 组件打包与 GitHub Actions

```sh
npm run pack:lib
```

生成 `lib/index.js`（ESM）、`lib/index.cjs`（CommonJS）、`lib/style.css` 和 `lib/types/`，以及可安装的 `vue-draggable-popup-1.0.0.tgz`。该命令还会在独立临时项目安装 tarball，检查 ESM/CJS 导出及严格 TypeScript 类型。Vue 是 peer dependency，Floating UI 为运行依赖，Ant Design Vue 仅为 Demo 开发依赖。

```sh
npm install ./vue-draggable-popup-1.0.0.tgz
```

```ts
import {
  DraggablePopup,
  DraggableModal,
  DraggableDrawer,
} from "vue-draggable-popup";
import "vue-draggable-popup/style.css";
```

`.github/workflows/component-build.yml` 在 push、PR 和手动触发时，使用 Node 24 执行类型检查、Lint、单元测试、Chromium E2E、Demo 构建与组件打包。成功后可在 GitHub Actions 的 Artifacts 下载 `vue-draggable-popup-<commit SHA>`（保留 30 天），浏览器报告保留 7 天。此流程产出组件包，不自动发布到 npm registry。

抽屉可配置 `:height="520"`，默认提供竖直缩放手柄；高度可增可减，并可超过初始高度。未指定 height 时铺满视口。Drawer 不再默认被 800px 限制，显式 maxHeight 仍生效，最终始终受视口安全边距约束。

Ant Design Vue 迁移可使用具名 `DraggableModal`、`DraggableDrawer`：支持 `v-model:open`、常用 Props 与同名插槽。Demo 增加两个迁移示例；兼容矩阵和事件差异见 [迁移指南](src/components/DraggablePopup/MIGRATION.md)。原 DraggablePopup API 保持可用。

此交付工作区原为空目录，没有可复用的业务代码、配置或测试框架。采用 Vue 3.5、TypeScript、Vite，新增组件与独立 Demo；未覆盖既有业务文件。原始 PRD 读取自 `D:/Downloads/DraggablePopup_PRD_Codex.md`。

## 运行

```sh
npm ci
npm run dev -- --port 5187 --strictPort
```

访问 http://127.0.0.1:5187/examples/draggable-popup （无路由工程，Vite fallback 和根路径均显示同一 Demo）。四角按钮和滚动容器按钮可独立打开；控制区提供拖动、缩放、全部手柄、外部关闭、placement、初始尺寸、双面板、复位尺寸和移除锚点。状态面板实时显示几何和事件。

“打开右侧抽屉”展示 `variant="drawer"`：支持拖动、八方向缩放、复位贴右。所有面板标题栏都支持一键放大/还原，抽屉底部也提供公开方法调用示例。放大保留普通位置与尺寸，随视口变化，关闭重开恢复普通尺寸。

## 验证

```sh
npm run typecheck
npm run lint
npm run build
npm test
npm run test:e2e
```

E2E 默认使用本机 Chrome（Chromium 内核），独立启动 5187 端口且禁止复用其他服务器。没有本机 Chrome 时，运行 `npx playwright install chromium`，再设置环境变量 `PW_CHANNEL=chromium` 运行。PowerShell：`$env:PW_CHANNEL='chromium'; npm run test:e2e`。测试不使用固定 sleep，几何容差为 0.5 CSS 像素，通过 Playwright 自动等待和轮询定位。

- [完整组件 API、交互、选型与 Ant Design Vue 接入](src/components/DraggablePopup/README.md)
- [逐项验收与实际测试结果](docs/ACCEPTANCE.md)
- [浏览器截图](docs/demo.png)

源码入口：`src/components/DraggablePopup/index.ts`。Demo：`src/demo/App.vue`。基础组件运行依赖仅为 Vue 与 Floating UI；Ant Design Vue 只用于 Demo。

# vue-popup
