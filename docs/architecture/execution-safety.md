# Execution Sandbox & Safety Controls (Draft)

## Threat Model
- Arbitrary code execution (LLM-generated) may exfiltrate data or damage host.
- Plugins could escalate privileges if not isolated.
- Long-running processes risk resource exhaustion and runaway costs.

## Sandbox Strategy
- Prefer Docker-based sandbox with ephemeral containers per command.
- Fallback to local Node VM with `child_process` + `vm` using tightened policies when Docker unavailable.
- All executions constrained to workspace overlay file system with optional read-only host mounts.

## Policy Parameters
- **CPU**: cgroup limits ≤ 30s per action (configurable).
- **Memory**: default cap 512MB; configurable per task with upper bound enforcement.
- **Network**: default outbound only; CLI flags to enable/disable, plugin overrides denied by default.
- **Filesystem**: workspace-only writes; artifacts hashed and tracked via `WorkspaceFile` records.

## Mitigations
- Truncate stdout/stderr beyond 8k chars to avoid prompt flooding.
- Enforce per-action timeout and global continuous-mode cap.
- Redact secrets by injecting env allowlist and scanning outputs before memory capture.
- Structured logging of executed commands + resource usage for audit.

## Error Handling
- Distinguish between sandbox policy violations vs runtime errors for feedback loop.
- Retry with degraded capabilities (e.g., disable network) before escalating to human intervention.

## Open Questions
- Evaluate Firecracker/wasmtime isolation as future enhancement.
- Determine plugin permission manifest to request elevated network or filesystem scopes.
