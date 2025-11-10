# Implementation Roadmap

## Phase 1 — Bootstrap
- Implement configuration loader (`ConfigLoader`) with `.env` + JSON merges.
- Build Commander CLI with `run` / `serve` commands and core flags.
- Connect OpenAI provider wrapper and basic logging.

## Phase 2 — Agent Loop MVP
- Implement `ThoughtProcess` prompt builder + parser (JSON schema enforcement).
- Wire `AgentLoop` lifecycle, capture proposals/results via `MemoryManager` stubs.
- Provide filesystem + web search tools and integrate into `ActionExecutor`.

## Phase 3 — Persistence & Memory
- Generate Prisma client + migrations for agents, cycles, memory records.
- Integrate vector store provider (Chroma by default) with embedding pipeline.
- Surface recall strategy combining episodic + semantic memory.

## Phase 4 — Execution & Plugins
- Implement Docker executor, local sandbox fallback, policy enforcement.
- Finalize plugin loader, manifest validator, example plugins (browser, TODO).
- Add plugin permission gating and CLI configuration toggles.

## Phase 5 — Agent Protocol & Telemetry
- Build Fastify REST API + WebSocket event stream compatible with Agent Protocol.
- Instrument telemetry (Winston + Sentry bridge) with structured logging.
- Harden error handling, retries, and human-in-the-loop feedback hooks.

## Phase 6 — Testing & Release
- Author Vitest suites for unit/integration coverage, including parity checks vs Python flows.
- Provide sample tasks, fixtures, and documentation updates.
- Package CLI (npm + Docker) and prepare contributor guidelines with CODEOWNERS.
