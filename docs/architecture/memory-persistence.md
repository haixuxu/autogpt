# Memory & Persistence Schema (Draft)

## Objectives
- Mirror AutoGPT 0.4.x agent lifecycle with resumable state.
- Support long-term vector search and short-term episodic recall.
- Enable workspace artifact tracking for reproducibility and sandboxing.

## Data Entities
- **Agent**: identity, directives, runtime config overrides.
- **AgentCycle**: per-iteration snapshot linked to proposals and results.
- **ActionProposal**: serialized LLM thoughts (tool call, reasoning, plan).
- **ActionResult**: execution outcome, structured output + error payload.
- **MemoryRecord**: unified store for observations, reflections, plans, results.
- **MemoryIndex**: embedding metadata for vector similarity (namespace scoped).
- **Workspace / WorkspaceFile**: track generated artifacts and file metadata.

## Relationships
- `Agent` 1..* `AgentCycle` – chronological episodes.
- `AgentCycle` 1..1 `ActionProposal` & `ActionResult` – persisted JSON.
- `Agent` 1..* `MemoryRecord`; optional cycle association for episodic context.
- `MemoryRecord` 1..* `MemoryIndex` – multi-namespace embeddings (e.g., short-term vs long-term stores).
- `Agent` 1..* `Workspace`; workspace 1..* `WorkspaceFile` for sandboxed artifacts.

## Memory Workflow
1. **Capture Proposal** – LLM output stored in `ActionProposal`, optional workspace cues.
2. **Capture Result** – Execution summary saved via `ActionResult`, pointer to artifacts.
3. **Record Memory** – Derived insights saved as `MemoryRecord`, embeddings inserted into `MemoryIndex`.
4. **Recall** – Query vector store first (`MemoryIndex`), hydrate `MemoryRecord` payloads, merge with recent `ActionResult`s.

## Vector Store Integration
- Primary vector store backed by Chroma/pgvector implementing `VectorStore` interface.
- Persistence uses `MemoryIndex` to mirror embeddings locally for portability.
- Embedding pipeline: `MemoryRecord` -> embed -> write to vector store & `MemoryIndex` (scores for fallback).

## Migration Notes
- Initial release targets SQLite for simplicity; optional Postgres upgrade path.
- Use Prisma migrations; incremental additions for new memory types or metadata.
- Ensure indexes on `AgentCycle` (`agentId`, `cycleIndex`) and `MemoryIndex.namespace` for fast lookup.

## Open Questions
- How to snapshot workspace contents efficiently (hash vs diff)?
- Define lifecycle for pruning long-term memory (age, relevance thresholds).
- Evaluate encryption-at-rest for sensitive Agent directives or outputs.
