# chess

基于 Turborepo 的联机象棋仓库，包含：

- `apps/web`：Vue 3 + Vite 前端
- `apps/server`：TypeScript + Socket.IO 服务端

## 开发

1. `pnpm install`
2. `pnpm dev`

默认情况下：

- Web 启动在 Vite 默认端口
- Server 启动在 `http://127.0.0.1:3001`
- Web 通过 `apps/web/.env.development` 中的 `VITE_WS` 连接服务端

## 常用命令

- `pnpm dev`：并行启动前后端
- `pnpm build`：构建全部应用
- `pnpm lint`：运行全部 lint
- `pnpm typecheck`：运行全部类型检查
- `pnpm --filter @chess/web dev`：只启动前端
- `pnpm --filter @chess/server dev`：只启动服务端

## TODO

1. 绘制棋盘棋子
2. 棋子逻辑
3. 联机
4. 翻转文字
5. 相机设置
6. 更多的材质
7. 环境
8. 重连
9. 换人
10. 将军提示

## 优化

1. SVGLoader
2. 优化数组比较方法
