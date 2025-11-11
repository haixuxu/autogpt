import type {
  PluginContext,
  PluginCommandDefinition,
  PluginCommandHandler,
} from './index';
import type { ToolRegistry } from '../tools/index';
import type { Logger } from '../telemetry/index';

export class DefaultPluginContext implements PluginContext {
  private commands: Map<string, { definition: PluginCommandDefinition; handler: PluginCommandHandler }> = new Map();

  constructor(
    public readonly agentId: string,
    private toolRegistry: ToolRegistry,
    public readonly logger: Logger,
    public readonly config: Record<string, unknown>
  ) {}

  registerTool(toolName: string): void {
    const tool = this.toolRegistry.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found in registry`);
    }
    this.logger.info(`Plugin registered tool: ${toolName}`);
  }

  registerCommand(
    definition: PluginCommandDefinition,
    handler: PluginCommandHandler
  ): void {
    if (this.commands.has(definition.name)) {
      throw new Error(`Command ${definition.name} already registered`);
    }

    this.commands.set(definition.name, { definition, handler });
    this.logger.info(`Plugin registered command: ${definition.name}`);
  }

  async executeCommand(name: string, args: Record<string, unknown>): Promise<unknown> {
    const command = this.commands.get(name);
    if (!command) {
      throw new Error(`Command ${name} not found`);
    }

    return await command.handler(args);
  }

  getCommands(): PluginCommandDefinition[] {
    return Array.from(this.commands.values()).map((c) => c.definition);
  }
}

