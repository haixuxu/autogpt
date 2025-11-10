export interface ToolExecutionContext {
  readonly workspaceRoot: string;
  readonly config: Record<string, unknown>;
  readonly logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
}

export interface Tool<TArgs = unknown, TResult = unknown> {
  readonly name: string;
  readonly description: string;
  readonly parameters?: ToolParameter[];
  readonly outputSchema?: Record<string, unknown>;
  invoke(args: TArgs, context: ToolExecutionContext): Promise<TResult>;
}

export interface ToolParameter {
  readonly name: string;
  readonly type: string;
  readonly description?: string;
  readonly required?: boolean;
  readonly enum?: readonly string[];
}

export interface ToolRegistry {
  register(tool: Tool): void;
  unregister(name: string): void;
  get(name: string): Tool | undefined;
  list(): Tool[];
}

export interface ToolAdapter {
  readonly registerBuiltinTools: (registry: ToolRegistry) => Promise<void> | void;
  readonly registerPluginTools: (registry: ToolRegistry) => Promise<void> | void;
}
