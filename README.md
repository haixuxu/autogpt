# AutoGPT Node 0.4.x

Node.js / TypeScript reimplementation of AutoGPT 0.4.x with autonomous AI agent capabilities.

## Status
- ✅ Phase 1: Configuration system, CLI framework, OpenAI provider, Winston logger
- ✅ Phase 2: Agent loop MVP with ThoughtProcess, ActionExecutor, filesystem & web tools
- ✅ Phase 3: Database integration (SQLite + Prisma), vector storage framework ready
- ⏸️ Phase 4-6: Plugins, error handling, testing (pending)

**Current State**: ✅ **BUILD SUCCESS!** The agent loop is functional with database persistence. Core features complete.

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
```bash
# Run the agent with a task
node dist/cli.js run "Analyze the project structure and create a summary"

# With options
node dist/cli.js run "Research latest AI news" --max-cycles 10 --workspace ./workspace

# List agents (Phase 3 required)
node dist/cli.js list

# Show agent details (Phase 3 required)
node dist/cli.js show <agent-id>
```

## Implementation Roadmap
1. ✅ Configuration loader, CLI commands, and environment management
2. ✅ MVP agent loop with OpenAI provider, filesystem + web search tools
3. 🚧 Memory persistence (Prisma) and vector store integration (Chroma)
4. ⏸️ Plugin loader, manifest validation, and example plugins
5. ⏸️ Local execution sandbox and enhanced telemetry
6. ⏸️ End-to-end tests and package release artifacts

## Contributing
Contribution guidelines will emerge alongside the first functional milestone. For now:
- Keep changes incremental and aligned with the architecture docs.
- Update parity matrix / design notes when scope shifts.
- Ensure lint (`pnpm lint`) and typecheck (`pnpm typecheck`) remain green.
