# 🚀 AutoGPT Web Interface - Quick Start

## 问题已修复 ✅

之前的错误 **"Failed to create task"** 已成功解决！

### 修复内容

1. **Prisma Workspace 配置**
   - 修复了 `pnpm-workspace.yaml` 配置
   - 为 API workspace 添加了 Prisma 依赖

2. **数据库路径问题**
   - 创建了数据库软链接：`api/prisma/autogpt.db -> ../../prisma/autogpt.db`
   - 在 API 目录添加了 `.env` 文件，使用绝对路径

3. **环境变量加载**
   - 在 `api/src/server.ts` 添加了 `import 'dotenv/config'`
   - 为 API 项目添加了 `dotenv` 依赖

4. **错误处理改进**
   - 在 API 路由中添加了详细的错误日志

---

## 启动步骤

### 1. 启动所有服务

```bash
cd /home/xuxihai/github/autogpt
pnpm dev:all
```

这将同时启动：
- **API 服务器**: http://localhost:3001
- **Web 界面**: http://localhost:3000

### 2. 或者分别启动

```bash
# 启动 API 服务器
pnpm dev:api

# 启动 Web 前端（新终端）
pnpm dev:web
```

---

## 验证服务

### 测试 API

```bash
# 健康检查
curl http://localhost:3001/health

# 创建任务
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"task": "Write a hello world program"}'

# 获取所有任务
curl http://localhost:3001/api/tasks
```

### 访问 Web 界面

1. 打开浏览器访问：http://localhost:3000
2. 点击 **"Create New Task"**
3. 填写任务描述
4. 点击 **"Create Task"**

---

## 目录结构

```
autogpt/
├── api/                    # API 服务器 (Fastify)
│   ├── src/
│   │   ├── server.ts      # 主服务器文件
│   │   └── routes/
│   │       ├── agents.ts   # Agent API
│   │       └── tasks.ts    # Task API
│   ├── prisma/            # 数据库软链接
│   │   ├── autogpt.db -> ../../prisma/autogpt.db
│   │   └── schema.prisma -> ../../prisma/schema.prisma
│   └── .env               # 数据库绝对路径
│
├── web/                    # Next.js Web 应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # 首页
│   │   │   └── tasks/
│   │   │       └── new/
│   │   │           └── page.tsx  # 创建任务页面
│   │   └── components/ui/   # shadcn/ui 组件
│   └── public/
│
├── prisma/                 # 数据库 Schema
│   ├── schema.prisma
│   └── autogpt.db         # SQLite 数据库
│
└── src/                    # 核心 CLI 功能
    └── core/
```

---

## API 端点

### Tasks

- `GET /api/tasks` - 获取所有任务
- `POST /api/tasks` - 创建新任务
  ```json
  {
    "task": "任务描述",
    "workspace": "工作目录（可选）"
  }
  ```
- `GET /api/tasks/:id` - 获取特定任务

### Agents

- `GET /api/agents` - 获取所有 agents
- `GET /api/agents/:id` - 获取特定 agent 详情

### WebSocket

- `ws://localhost:3001/ws` - 实时更新（待实现）

---

## 故障排除

### 问题：`ERR_CONNECTION_REFUSED`

**解决方案**：
```bash
# 检查服务是否运行
lsof -i :3000 -i :3001

# 重启服务
pkill -f "tsx|next"
pnpm dev:all
```

### 问题：`Unable to open the database file`

**解决方案**：
```bash
# 确保数据库存在
ls -la prisma/autogpt.db

# 如果不存在，运行迁移
npx prisma migrate dev

# 检查 API 的 .env 文件
cat api/.env
# 应该包含：
# DATABASE_URL="file:/home/xuxihai/github/autogpt/prisma/autogpt.db"
```

### 问题：`PrismaClient is not a constructor`

**解决方案**：
```bash
# 重新生成 Prisma 客户端
npx prisma generate

# 在 API workspace 中也生成
cd api && npx prisma generate
```

---

## 下一步

1. **实现任务执行逻辑** - 将 CLI 的 AgentLoop 集成到 API
2. **实时 WebSocket** - 显示任务执行进度
3. **任务详情页** - 显示 cycles、memories、执行日志
4. **Agent 详情页** - 查看 agent 配置和状态
5. **暗黑模式** - 添加主题切换
6. **身份验证** - 添加用户登录功能

---

## 技术栈

| 组件 | 技术 |
|------|------|
| API 服务器 | Fastify, TypeScript, Prisma |
| Web 前端 | Next.js 14, React 18, TypeScript |
| UI 库 | Tailwind CSS, shadcn/ui, Lucide Icons |
| 数据库 | SQLite (开发), Prisma ORM |
| 向量存储 | Chroma (待集成) |
| Monorepo | pnpm workspaces |

---

## 当前状态

✅ **完成**：
- API 服务器基础框架
- Task CRUD API
- Agent 查询 API
- Web 界面基础页面
- 创建任务功能
- 数据库集成

⏳ **进行中**：
- 任务执行集成
- 实时 WebSocket
- 任务详情页

📋 **待实现**：
- Agent 控制（暂停/恢复/停止）
- 文件浏览器
- 日志查看器
- 性能监控
- 暗黑模式

---

**版本**: 0.0.1  
**最后更新**: 2025-11-11  
**作者**: AutoGPT Team

