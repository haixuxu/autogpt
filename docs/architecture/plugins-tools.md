# Plugin System & Tool Abstractions (Draft)

## Goals
- Achieve parity with AutoGPT 0.4.x plugin loading (manifest-driven, CLI toggles).
- Allow runtime extension of commands and tools with strong typing and sandbox awareness.
- Enable dependency injection for logging, config, and workspace abstractions.

## Plugin Lifecycle
1. **Discovery**: Loader scans `plugins/` for `autogpt-plugin.json` manifests.
2. **Resolution**: Each manifest resolves to an ESM module exposing `register`, lifecycle hooks, and metadata.
3. **Registration**: Module receives `PluginContext` allowing it to register commands and tools.
4. **Activation**: Registered commands become available to the `ActionExecutor`; tools route through shared registry.
5. **Shutdown**: `onUnload` hook executed during agent teardown / hot reload.

## Manifest Schema (simplified)
```json
{
  "name": "auto-browser",
  "version": "0.1.0",
  "entry": "dist/index.js",
  "commands": [
    {
      "name": "browser.search",
      "description": "Perform a web search",
      "parameters": { "query": { "type": "string" } },
      "outputSchema": { "type": "object" }
    }
  ],
  "tools": ["browser.open"]
}
```

## Command Registration Flow
- Plugins call `registerCommand(definition, handler)`.
- Definitions translate into `ActionExecutor` command catalog entries.
- Handlers execute within sandboxed environment; may use shared services via dependency injection.

## Tool Registration Flow
- Built-in tools registered via `ToolAdapter.registerBuiltinTools` (filesystem, web search, code execution).
- Plugins may register additional tools referencing existing commands.
- Registry enforces unique names, exposes introspection for prompt construction.

## Security Considerations
- Plugin execution occurs with validated arguments (Zod schemas) before invocation.
- Sandbox ensures plugin I/O limited to workspace or configured scopes.
- Manifest version constraints validated to prevent incompatible API usage.

## Next Steps
- Define CLI toggles for enabling/disabling plugins per agent run.
- Implement manifest validator (Zod) and loader caching.
- Provide reference plugins mirroring Python 0.4.x examples (web browsing, TODO manager).
