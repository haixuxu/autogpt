import { Command } from 'commander';
import type { ConfigLoader } from '../config/index';
import type { Logger } from '../telemetry/index';
import { runCommand } from './commands/run';
import { listCommand } from './commands/list';
import { showCommand } from './commands/show';

export interface CliBootstrapOptions {
  readonly configLoader: ConfigLoader;
  readonly logger: Logger;
}

export class AutoGPTCli {
  private program: Command;
  private configLoader: ConfigLoader;
  private logger: Logger;

  constructor(options: CliBootstrapOptions) {
    this.configLoader = options.configLoader;
    this.logger = options.logger;
    this.program = new Command();
    this.setupProgram();
  }

  private setupProgram(): void {
    this.program
      .name('autogpt')
      .description('AutoGPT - Autonomous AI Agent')
      .version('0.0.1');

    // Run command
    this.program
      .command('run')
      .description('Run an agent with a given task')
      .argument('<task>', 'Task description for the agent')
      .option('-w, --workspace <path>', 'Workspace directory path')
      .option('-c, --continuous', 'Enable continuous mode', false)
      .option(
        '-m, --max-cycles <number>',
        'Maximum number of cycles',
        parseInt
      )
      .action(async (task: string, options) => {
        try {
          const config = await this.configLoader.resolve();
          await runCommand(task, {
            workspace: options.workspace || config.workspace.root,
            continuous: options.continuous,
            maxCycles: options.maxCycles,
            config,
            logger: this.logger,
          });
        } catch (error) {
          this.logger.error('Failed to execute run command', { error });
          process.exit(1);
        }
      });

    // List command
    this.program
      .command('list')
      .description('List all agents')
      .action(async () => {
        try {
          await listCommand({ logger: this.logger });
        } catch (error) {
          this.logger.error('Failed to execute list command', { error });
          process.exit(1);
        }
      });

    // Show command
    this.program
      .command('show')
      .description('Show agent details')
      .argument('<agent-id>', 'Agent ID')
      .action(async (agentId: string) => {
        try {
          await showCommand(agentId, { logger: this.logger });
        } catch (error) {
          this.logger.error('Failed to execute show command', { error });
          process.exit(1);
        }
      });
  }

  create(): Command {
    return this.program;
  }

  async run(argv?: string[]): Promise<void> {
    await this.program.parseAsync(argv);
  }
}

