# 🚀 启动AutoGPT Web界面

## 快速启动（3步）

### 1️⃣ 确保依赖已安装
```bash
pnpm install
```

### 2️⃣ 同时启动API和Web
```bash
pnpm dev:all
```

### 3️⃣ 访问
- **Web界面**: http://localhost:3000
- **API**: http://localhost:3001

---

## 🎯 使用步骤

### 1. 打开浏览器访问 http://localhost:3000

### 2. 创建任务
- 点击 "New Task" 按钮
- 输入任务描述
- 点击 "Create Task"

### 3. 查看任务
- Dashboard显示所有任务
- 点击任务查看详情

---

## 🔧 单独启动（可选）

如果需要分别启动服务:

```bash
# 终端1: API服务器
cd api && pnpm dev

# 终端2: Web应用
cd web && pnpm dev
```

---

## ✅ 验证

访问以下URL确认服务运行正常:

- http://localhost:3000 - Web界面
- http://localhost:3001/health - API健康检查
- http://localhost:3001/api/agents - Agents API
- http://localhost:3001/api/tasks - Tasks API

---

## 📝 提示

- 确保端口3000和3001未被占用
- 首次启动可能需要几秒钟
- 数据保存在SQLite数据库中（autogpt.db）
- CLI和Web共享同一数据库

---

**准备好了吗？运行:** `pnpm dev:all` 🚀
