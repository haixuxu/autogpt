# AutoGPT Node 0.4.x (Planning Snapshot)

This repository hosts the Node.js / TypeScript reimplementation of the AutoGPT 0.4.x feature set.
The current snapshot captures the approved architecture blueprint, interface contracts, and design
documents that will guide incremental delivery of the full agent stack.

## Status
- ✅ Project skeleton, tooling (pnpm, tsup, ESLint, Vitest) configured
- ✅ Core module interfaces defined (agent loop, config, plugins, tools, telemetry, server)
- ✅ Persistence & memory schema drafted (Prisma + vector store abstraction)
- ✅ Execution sandbox requirements outlined
- ✅ Feature parity matrix vs Python 0.4.x available
- 🚧 Implementation pending (LLM integration, CLI, Agent Protocol server, etc.)

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

## Roadmap (High Level)
1. Implement configuration loader, CLI commands, and environment management.
2. Deliver MVP agent loop with OpenAI provider, filesystem + web search tools.
3. Add memory persistence (Prisma migrations) and vector store integration.
4. Flesh out plugin loader, manifest validation, and example plugins.
5. Implement Docker/local execution sandbox and telemetry bridge.
6. Expose Agent Protocol-compatible REST + WebSocket services.
7. Ship end-to-end tests mirroring Python reference scenarios, package release artifacts.

## Contributing
Contribution guidelines will emerge alongside the first functional milestone. For now:
- Keep changes incremental and aligned with the architecture docs.
- Update parity matrix / design notes when scope shifts.
- Ensure lint (`pnpm lint`) and typecheck (`pnpm typecheck`) remain green.
