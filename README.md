# chess

## Project Overview

This repository contains a Turbo monorepo for online Chinese chess:

- `apps/web`: Vue 3 + Vite frontend
- `apps/server`: Express + Socket.IO backend
- `packages/game-core`: shared game and protocol logic

## Local Development

1. `pnpm install`
2. `pnpm dev`

By default:

- Web runs on the Vite dev server
- Server runs on `http://127.0.0.1:3001`
- Web connects to the backend through `apps/web/.env.development`

Useful commands:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Docker Single-Container Deployment

Production deployment now supports a single container:

- frontend assets are built into `apps/web/dist`
- the backend serves static files, HTTP endpoints, and Socket.IO from one process
- the frontend uses same-origin Socket.IO by default in production, so `VITE_WS` is only needed for local development

Build the image:

```bash
docker build -t chess-app .
```

Run the container:

```bash
docker run --rm -p 3001:3001 chess-app
```

Run on a custom port:

```bash
docker run --rm -e PORT=8080 -p 8080:8080 chess-app
```

After startup:

- app: `http://127.0.0.1:3001`
- health check: `http://127.0.0.1:3001/healthz`

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
