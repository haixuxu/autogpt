import type { Logger } from '../../telemetry/index';
import { CliUI } from '../ui';
import { PrismaDatabaseClient } from '../../../infra/database/client';

export interface ShowCommandOptions {
  logger?: Logger;
}

export async function showCommand(
  agentId: string,
  options: ShowCommandOptions
): Promise<void> {
  const ui = new CliUI();

  ui.section(`AutoGPT - Agent Details: ${agentId}`);

  try {
    const db = new PrismaDatabaseClient();
    const agent = await db.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      ui.error(`Agent not found: ${agentId}`);
      if (options.logger) {
        options.logger.warn('Agent not found', { agentId });
      }
      return;
    }

    // Parse JSON fields
    const profile = JSON.parse(agent.profile);
    const directives = JSON.parse(agent.directives);

    // Display agent info
    console.log('\n📋 Basic Information:');
    console.log(`   Name: ${agent.name}`);
    console.log(`   Status: ${agent.status}`);
    console.log(`   Task: ${agent.task}`);
    console.log(`   Created: ${agent.createdAt.toLocaleString()}`);
    console.log(`   Updated: ${agent.updatedAt.toLocaleString()}`);

    if (profile.description) {
      console.log('\n📝 Profile:');
      console.log(`   ${profile.description}`);
    }

    if (directives.constraints?.length > 0) {
      console.log('\n⚠️  Constraints:');
      directives.constraints.forEach((c: string, i: number) => {
        console.log(`   ${i + 1}. ${c}`);
      });
    }

    if (directives.resources?.length > 0) {
      console.log('\n🔧 Resources:');
      directives.resources.forEach((r: string, i: number) => {
        console.log(`   ${i + 1}. ${r}`);
      });
    }

    // Get cycles count
    const cyclesCount = await db.prisma.agentCycle.count({
      where: { agentId: agent.id },
    });
    console.log(`\n🔄 Cycles: ${cyclesCount}`);

    // Get memories count
    const memoriesCount = await db.prisma.memoryRecord.count({
      where: { agentId: agent.id },
    });
    console.log(`🧠 Memories: ${memoriesCount}`);

    console.log('');
    ui.success('Agent details retrieved');
    
    if (options.logger) {
      options.logger.info('Agent show command executed', { agentId });
    }
  } catch (error) {
    ui.error(`Failed to show agent: ${error}`);
    if (options.logger) {
      options.logger.error('Agent show command failed', { agentId, error });
    }
    throw error;
  }
}

