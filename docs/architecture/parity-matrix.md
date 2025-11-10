# AutoGPT 0.4.x Feature Parity Matrix

| Capability | Python 0.4.x Status | Node.js Target | Gap / Notes |
| --- | --- | --- | --- |
| CLI `run` / `serve` commands | Stable | Planned (Commander) | Implement CLI scaffolding with parity flags (`--continuous`, `--skip-news`, etc.). |
| Agent loop (one-shot prompt strategy) | Production | Designed | Need to implement `ThoughtProcess` with OpenAI function/tool support. |
| LLM provider multiplexing | Multi-model via Forge `MultiProvider` | Planned abstraction | Design provider adapters + rate limiting. |
| Workspace file management | Integrated file manager | Planned via `Workspace` + Prisma | Implement sandbox FS + hashing. |
| Code execution (Docker) | Enabled via Forge executor | Planned (ExecutorFactory) | Build Docker + local fallback wrappers. |
| Web search tools | Bing/SerpAPI integrations | Planned | Create tool adapters + config toggles. |
| Web browsing (Selenium) | Optional component | Planned | Investigate Playwright-based implementation. |
| Memory (short/long-term) | Episodic + vector (Pinecone/Chroma) | Designed (Prisma + VectorStore) | Implement embedding pipeline + configurable store. |
| Agent Protocol server | FastAPI service | Planned (Fastify + ws) | Mirror `/agent/tasks` endpoints + event streams. |
| Plugin system | Manifest-based, CLI toggles | Designed | Build loader, manifest validator, plugin sandbox. |
| Telemetry (Sentry, logs) | Configurable | Planned | Implement Winston logger + optional Sentry bridge. |
| TTS / Speak mode | Optional | Deferred | Evaluate third-party Node TTS libs; mark as stretch goal. |
| Continuous mode safeguards | Limit counters + human interrupts | Planned | Add global cycle caps + user prompt hooks. |
| Benchmark suite (AGBenchmark) | Provided | TBD | Plan integration with Node harness later. |
| Config system (.env, yaml) | Multi-source builder | Planned (ConfigLoader) | Implement environment + JSON merging, CLI overrides. |
| Tests | pytest + integration | Planned (Vitest) | Create spec harness mapping to Python scenarios. |

## Roadmap Notes
- Prioritize CLI, agent loop, tools, and memory to reach functional parity.
- Subsequent phases: Agent Protocol server, plugins, code execution.
- Stretch: TTS, benchmarking harness, advanced telemetry.
