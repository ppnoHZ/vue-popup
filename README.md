# Vue DraggablePopup

此交付工作区原为空目录，没有可复用的业务代码、配置或测试框架。采用 Vue 3.5、TypeScript、Vite，新增组件与独立 Demo；未覆盖既有业务文件。原始 PRD 读取自 `D:/Downloads/DraggablePopup_PRD_Codex.md`。

## 运行

```sh
npm ci
npm run dev -- --port 5187 --strictPort
```

访问 http://127.0.0.1:5187/examples/draggable-popup （无路由工程，Vite fallback 和根路径均显示同一 Demo）。四角按钮和滚动容器按钮可独立打开；控制区提供拖动、缩放、全部手柄、外部关闭、placement、初始尺寸、双面板、复位尺寸和移除锚点。状态面板实时显示几何和事件。

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
