import type { Logger } from '../../telemetry/index';
import type { Tool } from '../../tools/index';

import { CliUI } from '../ui';
import { DefaultToolRegistry } from '../../tools/registry';
import { registerBuiltinTools } from '../../tools/builtin/index';

export interface ToolsCommandOptions {
  logger?: Logger;
}

interface ToolCategory {
  name: string;
  icon: string;
  tools: Tool[];
}

export async function toolsCommand(
  options: ToolsCommandOptions
): Promise<void> {
  const ui = new CliUI();

  ui.section('AutoGPT - Available Tools');

  try {
    // Create tool registry and register all built-in tools
    const registry = new DefaultToolRegistry();
    registerBuiltinTools(registry);

    // Get all tools
    const allTools = registry.list();

    if (allTools.length === 0) {
      ui.info('No tools available');
      if (options.logger) {
        options.logger.info('No tools in registry');
      }
      return;
    }

    console.log(`\nFound ${allTools.length} tool(s)\n`);

    // Categorize tools
    const categories = categorizeTools(allTools);

    // Display each category
    for (const category of categories) {
      if (category.tools.length === 0) continue;

      console.log(
        `${category.icon} ${category.name} (${category.tools.length})`
      );
      console.log('─'.repeat(category.name.length + 6));

      for (const tool of category.tools) {
        console.log(`  • ${tool.name}`);
        console.log(`    ${tool.description}`);

        if (tool.parameters && tool.parameters.length > 0) {
          const params = tool.parameters
            .map((p) => {
              const required = p.required ? '*' : '';
              const enumValues = p.enum ? ` [${p.enum.join('|')}]` : '';
              return `${p.name}${required} (${p.type}${enumValues})`;
            })
            .join(', ');
          console.log(`    Parameters: ${params}`);
        } else {
          console.log(`    Parameters: none`);
        }

        console.log('');
      }
    }

    ui.success(
      `Listed ${allTools.length} tool(s) across ${categories.filter((c) => c.tools.length > 0).length} categories`
    );

    if (options.logger) {
      options.logger.info('Tools list command executed', {
        count: allTools.length,
      });
    }
  } catch (error) {
    ui.error(`Failed to list tools: ${error}`);
    if (options.logger) {
      options.logger.error('Tools list command failed', { error });
    }
    throw error;
  }
}

function categorizeTools(tools: Tool[]): ToolCategory[] {
  const categories: ToolCategory[] = [
    { name: 'Filesystem Tools', icon: '📁', tools: [] },
    { name: 'Web Tools', icon: '🌐', tools: [] },
    { name: 'Code Execution Tools', icon: '💻', tools: [] },
    { name: 'Other Tools', icon: '🔧', tools: [] },
  ];

  for (const tool of tools) {
    const name = tool.name.toLowerCase();

    if (
      name.includes('file') ||
      name.includes('directory') ||
      name.includes('download')
    ) {
      categories[0].tools.push(tool);
    } else if (
      name.includes('web') ||
      name.includes('search') ||
      name.includes('scrape')
    ) {
      categories[1].tools.push(tool);
    } else if (name.includes('execute') || name.includes('code')) {
      categories[2].tools.push(tool);
    } else {
      categories[3].tools.push(tool);
    }
  }

  return categories;
}

