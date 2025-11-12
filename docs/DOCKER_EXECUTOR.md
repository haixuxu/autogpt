# Docker Executor

Docker执行器为AutoGPT提供了增强的代码执行隔离和安全性。

## 概述

Docker执行器使用Docker容器来执行代码，相比本地沙箱执行器提供：

- **更强的隔离**：完全的进程和文件系统隔离
- **资源限制**：精确的CPU和内存限制
- **网络控制**：可配置的网络访问策略
- **跨平台一致性**：在不同环境中执行结果一致

## 先决条件

### 安装Docker

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
sudo usermod -aG docker $USER  # 允许非root用户使用Docker
```

**macOS/Windows:**
- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- 启动Docker Desktop应用程序

### 验证Docker

```bash
docker ps
# 应该显示Docker容器列表（可能为空）
```

## 使用方法

### 基本用法

```javascript
import { infra } from './dist/index.js';

const { DockerExecutor, DEFAULT_SANDBOX_POLICY } = infra;

// 创建Docker执行器
const executor = new DockerExecutor(DEFAULT_SANDBOX_POLICY);

// 执行Python代码
const result = await executor.execute({
  language: 'python',
  code: 'print("Hello from Docker!")',
});

console.log(result.stdout);  // "Hello from Docker!"
console.log(result.exitCode); // 0
```

### 支持的语言

| 语言 | Docker镜像 | 说明 |
|------|-----------|------|
| Python | `python:3.11-alpine` | Python 3.11 轻量级镜像 |
| JavaScript | `node:20-alpine` | Node.js 20 轻量级镜像 |
| Bash/Shell | `alpine:latest` | Alpine Linux with sh |

### 安全策略配置

```javascript
const customPolicy = {
  maxCpuSeconds: 60,           // 最大执行时间（秒）
  maxMemoryMb: 1024,           // 最大内存（MB）
  networkAccess: 'none',       // 'none' | 'outbound' | 'full'
  filesystemScope: 'workspace' // 'workspace' | 'temp' | 'sandbox'
};

const executor = new DockerExecutor(customPolicy);
```

### 高级用法

#### 带环境变量执行

```javascript
const result = await executor.execute({
  language: 'python',
  code: 'import os; print(os.environ.get("MY_VAR"))',
  environment: {
    MY_VAR: 'Hello World'
  }
});
```

#### 执行多文件项目

```javascript
const result = await executor.execute({
  language: 'python',
  code: 'from helper import greet; print(greet("World"))',
  files: [
    {
      path: 'helper.py',
      content: 'def greet(name):\n    return f"Hello, {name}!"'
    }
  ]
});
```

#### 设置超时

```javascript
const result = await executor.execute({
  language: 'python',
  code: 'import time; time.sleep(5); print("Done")',
  timeoutMs: 10000  // 10秒超时
});
```

## 工作原理

### 执行流程

1. **准备**：将代码写入临时文件
2. **镜像**：确保所需Docker镜像已拉取
3. **容器创建**：配置资源限制和挂载
4. **执行**：启动容器并运行代码
5. **收集**：获取stdout/stderr和退出码
6. **清理**：删除容器和临时文件

### 资源隔离

Docker执行器实施以下隔离：

```javascript
{
  // 内存限制
  Memory: policy.maxMemoryMb * 1024 * 1024,
  MemorySwap: policy.maxMemoryMb * 1024 * 1024,
  
  // CPU限制
  NanoCpus: 1000000000,  // 1 CPU核心
  
  // 网络隔离
  NetworkMode: policy.networkAccess === 'none' ? 'none' : 'bridge',
  
  // 文件系统
  Binds: ['${tempDir}:/workspace:ro'],  // 只读挂载
}
```

## 性能考虑

### 首次执行

首次使用时，Docker执行器会自动拉取所需镜像：

```
Pulling Docker image: python:3.11-alpine...
Successfully pulled python:3.11-alpine
```

这可能需要几秒到几分钟，取决于网络速度。后续执行会使用缓存的镜像。

### 执行时间

- **首次执行**：~40秒（包含镜像拉取）
- **后续执行**：~0.5-2秒（容器启动和执行）

### 镜像大小

| 镜像 | 压缩大小 | 解压大小 |
|------|---------|---------|
| python:3.11-alpine | ~20MB | ~50MB |
| node:20-alpine | ~40MB | ~120MB |
| alpine:latest | ~3MB | ~7MB |

## 对比本地执行器

| 特性 | 本地执行器 | Docker执行器 |
|------|----------|-------------|
| 隔离级别 | 进程 | 容器 |
| 启动时间 | <100ms | ~500ms |
| 资源限制 | 软限制 | 硬限制 |
| 网络控制 | 无 | 精确 |
| 平台依赖 | 需要本地runtime | 仅需Docker |
| 安全性 | 中 | 高 |

## 故障排除

### Docker未运行

**错误**:
```
Docker daemon is not running or not accessible
```

**解决方案**:
- Linux: `sudo systemctl start docker`
- macOS/Windows: 启动Docker Desktop

### 权限错误

**错误**:
```
permission denied while trying to connect to the Docker daemon socket
```

**解决方案**:
```bash
# Linux
sudo usermod -aG docker $USER
# 重新登录或重启
```

### 镜像拉取失败

**错误**:
```
Error pulling image: network timeout
```

**解决方案**:
- 检查网络连接
- 配置Docker镜像代理（如果在中国）
- 手动拉取镜像：`docker pull python:3.11-alpine`

## 最佳实践

### 1. 选择合适的执行器

- **开发/测试**：使用本地执行器（更快）
- **生产环境**：使用Docker执行器（更安全）
- **不信任代码**：必须使用Docker执行器

### 2. 优化镜像

如果需要自定义镜像：

```dockerfile
FROM python:3.11-alpine
RUN pip install numpy pandas  # 预安装依赖
```

### 3. 监控资源

```javascript
const result = await executor.execute({...});
console.log(`Execution time: ${result.durationMs}ms`);
console.log(`Exit code: ${result.exitCode}`);
```

### 4. 错误处理

```javascript
try {
  const result = await executor.execute({...});
  if (result.exitCode !== 0) {
    console.error('Execution failed:', result.stderr);
  }
} catch (error) {
  console.error('Docker error:', error.message);
  // Fallback to local executor
  const localExecutor = new LocalSandboxExecutor(policy);
  const result = await localExecutor.execute({...});
}
```

## 示例

### Python数据处理

```javascript
const result = await executor.execute({
  language: 'python',
  code: `
import json
data = [1, 2, 3, 4, 5]
result = {
    'sum': sum(data),
    'avg': sum(data) / len(data),
    'count': len(data)
}
print(json.dumps(result))
  `
});

const stats = JSON.parse(result.stdout);
console.log(stats);  // { sum: 15, avg: 3, count: 5 }
```

### Node.js HTTP请求

```javascript
const result = await executor.execute({
  language: 'javascript',
  code: `
const https = require('https');
https.get('https://api.github.com/zen', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
  `,
  timeoutMs: 5000
});
```

### Shell脚本

```javascript
const result = await executor.execute({
  language: 'bash',
  code: `
#!/bin/sh
echo "System Info:"
uname -a
echo "Disk Usage:"
df -h
echo "Memory:"
free -h
  `
});
```

## 安全注意事项

1. **不要禁用容器隔离**
2. **限制网络访问**（默认为outbound）
3. **设置合理的资源限制**
4. **定期更新Docker镜像**
5. **不要在容器内运行root用户代码**
6. **审查用户提供的代码**

## 扩展阅读

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Container Resource Constraints](https://docs.docker.com/config/containers/resource_constraints/)
- [Docker Networking](https://docs.docker.com/network/)

---

**版本**: 1.0.0  
**最后更新**: 2025-11-12

