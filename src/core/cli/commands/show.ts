import type { Logger } from '../../telemetry/index';
import { CliUI } from '../ui';

export interface ShowCommandOptions {
  logger?: Logger;
}

export async function showCommand(
  agentId: string,
  options: ShowCommandOptions
): Promise<void> {
  const ui = new CliUI();

  ui.section(`AutoGPT - Agent Details: ${agentId}`);

  // TODO: Implement database query in Phase 3
  ui.warning('Database integration not yet implemented - Phase 3 pending');
  
  if (options.logger) {
    options.logger.info('Agent show command executed', { agentId });
  }
}

