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

## 线上部署（Docker Compose + Nginx）

仓库根目录现在包含：

- `Dockerfile`：单容器构建前后端
- `docker-compose.yml`：编排 `app + nginx`
- `deploy/nginx/default.conf`：支持 Socket.IO 的 Nginx 反向代理
- `.env.deploy.example`：部署环境变量示例

推荐部署流程：

1. 本地或 CI 构建镜像

```bash
docker build -t your-registry/chess-app:latest .
```

2. 推送到镜像仓库

```bash
docker push your-registry/chess-app:latest
```

3. 在服务器上准备 compose 环境变量

```bash
cp .env.deploy.example .env
```

把 `.env` 里的 `APP_IMAGE` 改成你的镜像地址，例如：

```bash
APP_IMAGE=your-registry/chess-app:latest
HTTP_PORT=80
```

4. 启动服务

```bash
docker compose pull
docker compose up -d
```

5. 检查状态

```bash
docker compose ps
docker compose logs -f app
curl http://127.0.0.1/healthz
```

默认情况下：

- 外部访问入口是 `nginx` 容器的 `80` 端口
- 应用容器只在 compose 内部网络监听 `3001`
- WebSocket 与普通 HTTP 请求都通过 Nginx 转发

如果你的服务器已经有宿主机 Nginx：

- 可以只运行 `app` 容器，把它映射到 `127.0.0.1:3001:3001`
- 然后参考 `deploy/nginx/default.conf`，把上游地址从 `app:3001` 改成 `127.0.0.1:3001`
- HTTPS 证书也更适合放在宿主机 Nginx 或 Caddy 上统一处理

## 宿主机 Nginx + HTTPS（Ubuntu / 宝塔）

这条部署路径适合：

- 服务器已经装了宿主机 Nginx
- 想把 HTTPS、证书续期、多个站点统一交给宿主机处理
- Docker 里只跑应用容器，不再额外跑一个 Nginx 容器

相关文件：

- `docker-compose.host-nginx.yml`：只启动 `app` 容器，并绑定到 `127.0.0.1:3001`
- `.env.host.example`：宿主机 Nginx 模式的环境变量示例
- `deploy/scripts/deploy-host-nginx.sh`：Ubuntu 部署应用容器脚本
- `deploy/nginx/chess.host-http.conf.example`：Ubuntu 原生 Nginx 的 HTTP 反代模板
- `deploy/nginx/chess.host-https.conf.example`：Ubuntu 原生 Nginx 的 HTTPS 反代模板
- `deploy/nginx/chess.baota-snippet.conf.example`：宝塔站点里可直接粘贴的反代片段

### 1. 先部署应用容器

```bash
cp .env.host.example .env.host
```

把 `.env.host` 改成你的镜像地址，例如：

```bash
APP_IMAGE=your-registry/chess-app:latest
APP_PORT=3001
```

如果你打算直接在服务器本机执行构建，也可以先运行：

```bash
docker build -t chess-app:latest .
```

然后保留：

```bash
APP_IMAGE=chess-app:latest
```

然后执行：

```bash
sh deploy/scripts/deploy-host-nginx.sh
```

执行成功后，应用只会监听宿主机本地：

```bash
curl http://127.0.0.1:3001/healthz
```

### 2. Ubuntu 原生 Nginx

先安装 Nginx：

```bash
sudo apt update
sudo apt install -y nginx
```

如果你还没有证书，先用 HTTP 模板把站点跑起来：

```bash
sudo cp deploy/nginx/chess.host-http.conf.example /etc/nginx/sites-available/chess.conf
sudo ln -sf /etc/nginx/sites-available/chess.conf /etc/nginx/sites-enabled/chess.conf
```

然后把配置里的：

- `example.com`
- `www.example.com`
- `127.0.0.1:3001`（如果你改了 `APP_PORT`）

替换成你的实际值，再执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

证书准备好以后，把站点配置替换为 `deploy/nginx/chess.host-https.conf.example` 对应内容，再次校验并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

如果你使用 Certbot，常见安装方式是：

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 3. 宝塔面板

宝塔更推荐：

1. 在面板里先创建站点并绑定域名
2. 在面板里申请 SSL 证书
3. 打开站点配置，把 `deploy/nginx/chess.baota-snippet.conf.example` 中的内容粘进去
4. 确认反代目标是 `http://127.0.0.1:3001`
5. 保存并重载 Nginx

### 4. 验证

```bash
curl -I http://127.0.0.1:3001/healthz
curl -I https://your-domain/healthz
docker compose --env-file .env.host -f docker-compose.host-nginx.yml ps
docker compose --env-file .env.host -f docker-compose.host-nginx.yml logs -f app
```

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
