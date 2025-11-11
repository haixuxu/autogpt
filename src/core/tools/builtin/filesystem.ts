import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, resolve, relative } from 'path';
import { existsSync } from 'fs';
import type { Tool, ToolExecutionContext } from '../index';

export class ReadFileTool implements Tool<{ path: string }, string> {
  readonly name = 'read_file';
  readonly description = 'Read the contents of a file';
  readonly parameters = [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file to read',
      required: true,
    },
  ];

  async invoke(
    args: { path: string },
    context: ToolExecutionContext
  ): Promise<string> {
    const fullPath = resolve(context.workspaceRoot, args.path);
    
    // Security check
    if (!fullPath.startsWith(context.workspaceRoot)) {
      throw new Error('Access denied: path outside workspace');
    }

    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${args.path}`);
    }

    const content = await readFile(fullPath, 'utf-8');
    context.logger.info(`Read file: ${args.path}`, {
      size: content.length,
    });

    return content;
  }
}

export class WriteFileTool
  implements Tool<{ path: string; content: string }, string>
{
  readonly name = 'write_file';
  readonly description = 'Write content to a file';
  readonly parameters = [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file to write',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content to write to the file',
      required: true,
    },
  ];

  async invoke(
    args: { path: string; content: string },
    context: ToolExecutionContext
  ): Promise<string> {
    const fullPath = resolve(context.workspaceRoot, args.path);

    // Security check
    if (!fullPath.startsWith(context.workspaceRoot)) {
      throw new Error('Access denied: path outside workspace');
    }

    // Ensure directory exists
    const dir = join(fullPath, '..');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(fullPath, args.content, 'utf-8');
    context.logger.info(`Wrote file: ${args.path}`, {
      size: args.content.length,
    });

    return `Successfully wrote ${args.content.length} bytes to ${args.path}`;
  }
}

export class ListDirectoryTool implements Tool<{ path?: string }, string[]> {
  readonly name = 'list_directory';
  readonly description = 'List files and directories in a path';
  readonly parameters = [
    {
      name: 'path',
      type: 'string',
      description: 'Path to list (defaults to workspace root)',
      required: false,
    },
  ];

  async invoke(
    args: { path?: string },
    context: ToolExecutionContext
  ): Promise<string[]> {
    const targetPath = args.path
      ? resolve(context.workspaceRoot, args.path)
      : context.workspaceRoot;

    // Security check
    if (!targetPath.startsWith(context.workspaceRoot)) {
      throw new Error('Access denied: path outside workspace');
    }

    if (!existsSync(targetPath)) {
      throw new Error(`Directory not found: ${args.path || '.'}`);
    }

    const entries = await readdir(targetPath);
    const results: string[] = [];

    for (const entry of entries) {
      const fullPath = join(targetPath, entry);
      const stats = await stat(fullPath);
      const type = stats.isDirectory() ? 'dir' : 'file';
      const size = stats.isFile() ? stats.size : 0;
      results.push(`${type}: ${entry} (${size} bytes)`);
    }

    context.logger.info(`Listed directory: ${args.path || '.'}`, {
      count: results.length,
    });

    return results;
  }
}

