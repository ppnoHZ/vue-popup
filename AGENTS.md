# Project workflow

- 每轮代码修改完成并通过相关验证后，提交并 push 到当前分支。这是用户明确要求的持续工作方式。
- 基础组件保持独立于 Ant Design Vue；Antdv 只用于 Demo。
- `npm run build` 构建 Demo，`npm run pack:lib` 构建、校验并打包组件库。
- 组件库产物位于 `lib/`，npm tarball 位于根目录；两者不提交到 Git。
