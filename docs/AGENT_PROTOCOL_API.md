# Agent Protocol API Documentation

本文档描述AutoGPT实现的Agent Protocol API端点规范。

## 概述

Agent Protocol是一个标准化的API规范，用于与自主AI代理进行交互。AutoGPT实现了完整的Agent Protocol规范，包括：

- ✅ Tasks API - 任务管理
- ✅ Steps API - 步骤跟踪
- ✅ Artifacts API - 产物管理
- ✅ WebSocket Events - 实时事件流
- ✅ Task Control - 任务控制（pause/resume/cancel）

## 基础URL

```
http://localhost:3001/api
```

## 认证

当前版本不需要认证。未来版本将支持API密钥认证。

---

## Tasks API

### 1. 列出所有任务

```http
GET /api/tasks?page=1&pageSize=20
```

**查询参数：**
- `page` (可选): 页码，默认为1
- `pageSize` (可选): 每页数量，默认为20

**响应：**

```json
{
  "tasks": [
    {
      "task_id": "clx1234567890",
      "input": "Task description",
      "status": "running",
      "created_at": "2024-01-15T10:30:00.000Z",
      "modified_at": "2024-01-15T10:35:00.000Z",
      "artifacts": [
        {
          "artifact_id": "art123",
          "file_name": "output.txt",
          "relative_path": "output/output.txt"
        }
      ]
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**任务状态：**
- `created` - 任务已创建
- `running` - 任务正在执行
- `completed` - 任务成功完成
- `failed` - 任务执行失败
- `paused` - 任务已暂停
- `cancelled` - 任务已取消

---

### 2. 创建新任务

```http
POST /api/tasks
```

**请求体：**

```json
{
  "task": "Task description or instruction",
  "workspace": "./workspace" // 可选
}
```

**响应：**

```json
{
  "agent": {
    "id": "clx1234567890",
    "name": "Task: Task description",
    "status": "ACTIVE",
    "task": "Task description",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. 获取任务详情

```http
GET /api/tasks/:id
```

**响应：**

详细的任务信息，包括cycles（执行周期）、memories（记忆）、workspaces（工作空间）等。

---

### 4. 删除任务

```http
DELETE /api/tasks/:id
```

**响应：** 204 No Content

---

### 5. 暂停任务

```http
POST /api/tasks/:id/pause
```

**响应：**

```json
{
  "task_id": "clx1234567890",
  "status": "paused"
}
```

---

### 6. 恢复任务

```http
POST /api/tasks/:id/resume
```

**响应：**

```json
{
  "task_id": "clx1234567890",
  "status": "running"
}
```

---

### 7. 取消任务

```http
POST /api/tasks/:id/cancel
```

**响应：**

```json
{
  "task_id": "clx1234567890",
  "status": "cancelled"
}
```

取消任务会：
- 将任务状态设置为 `CANCELLED`
- 将所有正在运行的步骤标记为失败
- 发送WebSocket事件通知

---

## Steps API

### 1. 列出任务的所有步骤

```http
GET /api/tasks/:taskId/steps?page=1&pageSize=20
```

**查询参数：**
- `page` (可选): 页码
- `pageSize` (可选): 每页数量

**响应：**

```json
{
  "steps": [
    {
      "step_id": "step123",
      "task_id": "clx1234567890",
      "name": "Step 1",
      "status": "completed",
      "input": { "action": "read_file", "path": "test.txt" },
      "output": { "content": "File content" },
      "additional_input": {},
      "additional_output": {},
      "artifacts": [
        {
          "artifact_id": "art123",
          "file_name": "output.txt",
          "relative_path": "output.txt",
          "uri": "file:///path/to/output.txt"
        }
      ],
      "is_last": false,
      "created_at": "2024-01-15T10:30:00.000Z",
      "started_at": "2024-01-15T10:30:05.000Z",
      "completed_at": "2024-01-15T10:30:15.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

**步骤状态：**
- `created` - 步骤已创建
- `running` - 步骤正在执行
- `completed` - 步骤完成
- `failed` - 步骤失败

---

### 2. 创建新步骤

```http
POST /api/tasks/:taskId/steps
```

**请求体：**

```json
{
  "name": "Step name", // 可选
  "input": {
    "action": "read_file",
    "path": "test.txt"
  },
  "additional_input": {
    "context": "Additional context"
  } // 可选
}
```

**响应：** 201 Created

```json
{
  "step_id": "step123",
  "task_id": "clx1234567890",
  "name": "Step 1",
  "status": "created",
  "input": { "action": "read_file", "path": "test.txt" },
  "output": null,
  "additional_input": { "context": "Additional context" },
  "additional_output": {},
  "artifacts": [],
  "is_last": false,
  "created_at": "2024-01-15T10:30:00.000Z",
  "started_at": null,
  "completed_at": null
}
```

---

### 3. 获取步骤详情

```http
GET /api/tasks/:taskId/steps/:stepId
```

**响应：** 与步骤列表中单个步骤格式相同

---

### 4. 更新步骤

```http
PATCH /api/tasks/:taskId/steps/:stepId
```

**请求体：**

```json
{
  "status": "running", // 或 "completed", "failed"
  "output": {
    "result": "Operation result",
    "data": "Output data"
  }, // 可选
  "additional_output": {
    "metrics": { "duration": 1500 }
  }, // 可选
  "is_last": true // 可选
}
```

**响应：** 更新后的步骤对象

**自动时间戳：**
- 当状态变为 `running` 时，自动设置 `started_at`
- 当状态变为 `completed` 或 `failed` 时，自动设置 `completed_at`

---

## Artifacts API

### 1. 列出步骤的所有产物

```http
GET /api/tasks/:taskId/steps/:stepId/artifacts?page=1&pageSize=20
```

**查询参数：**
- `page` (可选): 页码
- `pageSize` (可选): 每页数量

**响应：**

```json
{
  "artifacts": [
    {
      "artifact_id": "art123",
      "file_name": "output.txt",
      "relative_path": "output/output.txt",
      "uri": "file:///absolute/path/to/output.txt",
      "mime_type": "text/plain",
      "size_bytes": 1024,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 2. 获取产物元数据

```http
GET /api/tasks/:taskId/steps/:stepId/artifacts/:artifactId
```

**响应：** 单个产物对象

---

### 3. 上传产物

```http
POST /api/tasks/:taskId/steps/:stepId/artifacts
Content-Type: multipart/form-data
```

**表单数据：**
- `file` (必需): 要上传的文件
- `relative_path` (可选): 文件的相对路径

**响应：** 201 Created

```json
{
  "artifact_id": "art123",
  "file_name": "output.txt",
  "relative_path": "output/output.txt",
  "uri": "file:///absolute/path/to/artifacts/taskId_stepId_timestamp_output.txt",
  "mime_type": "text/plain",
  "size_bytes": 1024,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**文件存储：**
- 文件存储在 `ARTIFACTS_DIR` 目录（默认：`./artifacts`）
- 文件名格式：`{taskId}_{stepId}_{timestamp}_{originalName}`
- 最大文件大小：50MB

---

### 4. 下载产物

```http
GET /api/tasks/:taskId/steps/:stepId/artifacts/:artifactId/download
```

**响应：** 文件内容（二进制流）

**响应头：**
- `Content-Type`: 产物的MIME类型
- `Content-Disposition`: attachment; filename="原始文件名"
- `Content-Length`: 文件大小（字节）

---

### 5. 删除产物

```http
DELETE /api/tasks/:taskId/steps/:stepId/artifacts/:artifactId
```

**响应：** 204 No Content

删除操作会：
- 从数据库删除产物记录
- 从磁盘删除产物文件

---

## WebSocket Events

### 连接

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  // 订阅特定任务的事件
  ws.send(JSON.stringify({
    type: 'subscribe',
    agentId: 'clx1234567890'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
};
```

### 事件类型

**连接事件：**

```json
{
  "type": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**订阅确认：**

```json
{
  "type": "subscribed",
  "agentId": "clx1234567890",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**任务事件：**

```json
{
  "type": "task.created",
  "task_id": "clx1234567890",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

可用的任务事件：
- `task.created` - 任务创建
- `task.started` - 任务开始
- `task.completed` - 任务完成
- `task.failed` - 任务失败
- `task.cancelled` - 任务取消
- `task.paused` - 任务暂停
- `task.resumed` - 任务恢复

**步骤事件：**

```json
{
  "type": "step.created",
  "task_id": "clx1234567890",
  "step_id": "step123",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

可用的步骤事件：
- `step.created` - 步骤创建
- `step.started` - 步骤开始（状态变为running）
- `step.running` - 步骤执行中（更新）
- `step.completed` - 步骤完成
- `step.failed` - 步骤失败

**产物事件：**

```json
{
  "type": "artifact.created",
  "task_id": "clx1234567890",
  "step_id": "step123",
  "artifact_id": "art123",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**日志事件：**

```json
{
  "type": "log",
  "task_id": "clx1234567890",
  "data": "Log message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 错误响应

所有错误响应遵循统一格式：

```json
{
  "error": "Error description",
  "message": "Detailed error message", // 可选
  "details": "Additional details" // 可选
}
```

**常见HTTP状态码：**
- `200` - 成功
- `201` - 创建成功
- `204` - 删除成功（无内容）
- `400` - 请求错误
- `404` - 资源不存在
- `500` - 服务器错误

---

## 使用示例

### 创建并执行任务

```javascript
// 1. 创建任务
const createResponse = await fetch('http://localhost:3001/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: 'Create a report about sales data',
    workspace: './workspace'
  })
});
const { agent } = await createResponse.json();
const taskId = agent.id;

// 2. 创建执行步骤
const stepResponse = await fetch(`http://localhost:3001/api/tasks/${taskId}/steps`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Analyze sales data',
    input: { action: 'analyze', dataset: 'sales_2024.csv' }
  })
});
const step = await stepResponse.json();

// 3. 更新步骤状态为运行中
await fetch(`http://localhost:3001/api/tasks/${taskId}/steps/${step.step_id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'running' })
});

// 4. 完成步骤并上传结果
await fetch(`http://localhost:3001/api/tasks/${taskId}/steps/${step.step_id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'completed',
    output: { summary: 'Sales increased by 15%' },
    is_last: true
  })
});

// 5. 上传产物
const formData = new FormData();
formData.append('file', reportFile);
formData.append('relative_path', 'reports/sales_report.pdf');

await fetch(`http://localhost:3001/api/tasks/${taskId}/steps/${step.step_id}/artifacts`, {
  method: 'POST',
  body: formData
});
```

---

## 环境变量

配置API服务器的环境变量：

```bash
# API服务器端口
API_PORT=3001

# 产物存储目录
ARTIFACTS_DIR=./artifacts

# 数据库URL（SQLite）
DATABASE_URL=file:./prisma/autogpt.db
```

---

## 与官方Agent Protocol的差异

AutoGPT实现了Agent Protocol的核心功能，但有以下扩展：

1. **任务控制**：额外支持pause/resume/cancel操作
2. **分页支持**：所有列表端点都支持分页
3. **WebSocket增强**：更丰富的事件类型
4. **向后兼容**：保留了原有的agent相关端点

---

## 相关资源

- [Agent Protocol 官方规范](https://agentprotocol.ai/)
- [AutoGPT 文档](../README.md)
- [API测试脚本](../api/test-agent-protocol.mjs)

---

## 版本历史

- **v0.1.0** (2024-01-15): 初始实现
  - Tasks API
  - Steps API
  - Artifacts API
  - WebSocket Events
  - Task Control

