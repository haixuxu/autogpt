export interface PluginManifest {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly entry: string;
  readonly author?: string;
  readonly license?: string;
  readonly minAutoGptVersion?: string;
  readonly commands?: PluginCommandDefinition[];
  readonly tools?: string[];
}

export interface PluginCommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters?: Record<string, unknown>;
  readonly outputSchema?: Record<string, unknown>;
}

export interface PluginLifecycle {
  readonly onLoad?: (context: PluginContext) => Promise<void> | void;
  readonly onUnload?: (context: PluginContext) => Promise<void> | void;
}

export interface PluginContext {
  readonly agentId: string;
  readonly registerTool: (tool: string) => void;
  readonly registerCommand: (definition: PluginCommandDefinition, handler: PluginCommandHandler) => void;
  readonly config: Record<string, unknown>;
  readonly logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
}

export interface PluginCommandHandler {
  (args: Record<string, unknown>): Promise<unknown>;
}

export interface PluginModule extends PluginLifecycle {
  readonly manifest: PluginManifest;
  readonly register: (context: PluginContext) => Promise<void> | void;
}

export interface PluginLoader {
  discover(): Promise<PluginManifest[]>;
  load(manifest: PluginManifest): Promise<PluginModule>;
  resolve(manifest: PluginManifest): Promise<PluginModuleFactory>;
}

export type PluginModuleFactory = () => Promise<PluginModule> | PluginModule;
