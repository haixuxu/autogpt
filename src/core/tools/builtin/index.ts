import type { ToolRegistry } from '../index';
import {
  ReadFileTool,
  WriteFileTool,
  ListDirectoryTool,
} from './filesystem';
import { WebSearchTool, WebScrapeTool } from './web-search';
import { ExecuteCodeTool } from './code-execution';

export * from './filesystem';
export * from './web-search';
export * from './code-execution';

export function registerBuiltinTools(registry: ToolRegistry): void {
  // Filesystem tools
  registry.register(new ReadFileTool());
  registry.register(new WriteFileTool());
  registry.register(new ListDirectoryTool());

  // Web tools
  registry.register(new WebSearchTool());
  registry.register(new WebScrapeTool());

  // Code execution
  registry.register(new ExecuteCodeTool());
}

