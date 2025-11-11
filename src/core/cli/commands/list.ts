import type { Logger } from '../../telemetry/index';
import { CliUI } from '../ui';
import { PrismaDatabaseClient } from '../../../infra/database/client';

export interface ListCommandOptions {
  logger?: Logger;
}

export async function listCommand(options: ListCommandOptions): Promise<void> {
  const ui = new CliUI();

  ui.section('AutoGPT - Agent List');

  try {
    const db = new PrismaDatabaseClient();
    const agents = await db.prisma.agent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        status: true,
        task: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            cycles: true,
          },
        },
      },
    });

    if (agents.length === 0) {
      ui.info('No agents found. Run a task to create your first agent!');
      if (options.logger) {
        options.logger.info('No agents in database');
      }
      return;
    }

    console.log(`\nFound ${agents.length} agent(s):\n`);

    for (const agent of agents) {
      console.log(`📋 ${agent.name}`);
      console.log(`   ID: ${agent.id}`);
      console.log(`   Status: ${agent.status}`);
      console.log(`   Task: ${agent.task}`);
      console.log(`   Cycles: ${agent._count.cycles}`);
      console.log(`   Created: ${agent.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${agent.updatedAt.toLocaleString()}`);
      console.log('');
    }

    ui.success(`Listed ${agents.length} agent(s)`);
    
    if (options.logger) {
      options.logger.info('Agent list command executed', { count: agents.length });
    }
  } catch (error) {
    ui.error(`Failed to list agents: ${error}`);
    if (options.logger) {
      options.logger.error('Agent list command failed', { error });
    }
    throw error;
  }
}

