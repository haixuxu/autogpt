import type { ActionExecutor, ActionProposal, ActionResult } from './actions';
import type { ToolRegistry } from '../tools/index';
import type { Logger } from '../telemetry/index';

export class DefaultActionExecutor implements ActionExecutor {
  constructor(
    private toolRegistry: ToolRegistry,
    private logger: Logger
  ) {}

  async execute(proposal: ActionProposal): Promise<ActionResult> {
    const { command, arguments: args, metadata } = proposal;
    const startTime = Date.now();

    this.logger.info(`Executing action: ${command}`, { args });

    try {
      const tool = this.toolRegistry.get(command);

      if (!tool) {
        return {
          success: false,
          output: { error: `Tool '${command}' not found` },
          summary: `Failed: Tool '${command}' not found`,
          metadata,
          error: new Error(`Tool '${command}' not found`),
        };
      }

      // Execute the tool
      const result = await tool.invoke(args, {
        workspaceRoot: process.cwd(),
        config: {},
        logger: this.logger,
      });

      const duration = Date.now() - startTime;
      this.logger.info(`Action completed: ${command}`, {
        duration,
        success: true,
      });

      return {
        success: true,
        output: result,
        summary: `Successfully executed ${command}`,
        metadata,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Action failed: ${command}`, {
        error,
        duration,
      });

      return {
        success: false,
        output: { error: String(error) },
        summary: `Failed to execute ${command}: ${error}`,
        metadata,
        error: error as Error,
      };
    }
  }
}

