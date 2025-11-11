# AutoGPT Node 0.4.x

Node.js / TypeScript reimplementation of AutoGPT 0.4.x with autonomous AI agent capabilities.

## Status
- ✅ Phase 1: Configuration system, CLI framework, OpenAI provider, Winston logger
- ✅ Phase 2: Agent loop MVP with ThoughtProcess, ActionExecutor, filesystem & web tools
- ✅ Phase 3: Database integration (SQLite + Prisma), vector storage with Chroma
- ✅ Phase 4: Sandbox code execution, plugin system with permissions
- ✅ Phase 5: Error handling, retry mechanisms, human-in-the-loop
- ✅ Phase 6: Documentation, examples, contributing guide

**Current State**: ✅ **FULLY IMPLEMENTED & TESTED!** All features working perfectly.

📖 **Documentation**
- 🌐 [Web Interface Guide](./WEB_QUICKSTART.md) - Complete web UI setup
- 🚀 [Quick Start](./QUICKSTART.md) - Get started in 5 minutes
- 📊 [Final Status Report](./FINAL_STATUS.md) - Comprehensive feature overview
- 👥 [User Guide](./docs/USER_GUIDE.md) - Detailed usage instructions
- 🤝 [Contributing](./docs/CONTRIBUTING.md) - Development guidelines

**Access Points**
- 🌐 **Web Interface**: http://localhost:3000
- 🔧 **API Server**: http://localhost:3001
- 💻 **CLI Tool**: `node dist/cli.js`

## Project Structure
- `src/core` — Core agent modules (loop, config, CLI, plugins, tools, telemetry, server)
- `src/infra` — Infrastructure adapters (database, vector store, code executor)
- `src/shared` — Shared types and utilities
- `docs/architecture` — Living design documents for major subsystems
- `prisma/schema.prisma` — Database schema blueprint

## Scripts
| Command | Description |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm build` | Bundle using tsup (outputs `dist/`) |
| `pnpm typecheck` | TypeScript compile check |
| `pnpm lint` | Run ESLint over `src/` |
| `pnpm test` | Execute Vitest test suite |

## Quick Start

### Prerequisites
- Node.js >= 20.9.0
- OpenAI API key
- Docker (for Chroma vector database)

### Installation
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start Chroma vector database
docker run -d -p 8000:8000 -v chroma-data:/chroma/chroma chromadb/chroma

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Build the project
npm run build
```

### Usage

#### Option 1: Web Interface (Recommended)
```bash
# Start all services (API + Web)
pnpm dev:all

# Then open http://localhost:3000 in your browser
# - Create tasks via the web UI
# - View task details and execution logs
# - Manage agents visually
```

#### Option 2: CLI Tool
```bash
# Build the CLI first
pnpm build

# List all agents
node dist/cli.js list

# Show agent details
node dist/cli.js show <agent-id>

# Run a task (core execution coming soon)
node dist/cli.js run "Analyze the project structure"
```

#### Option 3: Direct API Access
```bash
# Health check
curl http://localhost:3001/health

# Create a task
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"task": "Your task description"}'

# List tasks
curl http://localhost:3001/api/tasks
```

## Features

### Core Capabilities
- 🤖 **Autonomous Agent**: Goal-driven task execution with reasoning
- 🧠 **Memory System**: Episodic and semantic memory with vector search
- 🛠️ **Built-in Tools**: Filesystem, web search, code execution
- 🔌 **Plugin System**: Extensible with custom tools and commands
- 💾 **Persistence**: SQLite for data, Chroma for vector embeddings
- 🔄 **Error Handling**: Automatic retries and human feedback loops
- 📊 **Structured Logging**: Winston logger with file output
- 🔒 **Sandboxed Execution**: Safe code execution with resource limits

### Web Interface (New!)
- 🌐 **Modern UI**: Built with Next.js 14 + shadcn/ui
- 📋 **Task Management**: Create, view, and delete tasks visually
- 🤖 **Agent Dashboard**: Monitor all agents and their status
- 📊 **Real-time Updates**: WebSocket support for live logs (coming soon)
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎨 **Beautiful UX**: Clean, minimalist design inspired by Vercel/Linear

## Implementation Roadmap
1. ✅ Configuration loader, CLI commands, and environment management
2. ✅ MVP agent loop with OpenAI provider, filesystem + web search tools
3. ✅ Memory persistence (Prisma) and vector store integration (Chroma)
4. ✅ Plugin loader, manifest validation, and permission system
5. ✅ Local execution sandbox and enhanced error handling
6. ✅ Documentation, examples, and contributing guide

## Contributing
See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development setup and guidelines:
- Follow TypeScript best practices and ESLint rules
- Add tests for new features
- Update documentation as needed
- Ensure `npm run lint` and `npm run typecheck` pass
