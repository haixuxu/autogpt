import { readFile, writeFile, appendFile, unlink, readdir, stat, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import axios from 'axios';
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

export class AppendToFileTool
  implements Tool<{ path: string; content: string }, string>
{
  readonly name = 'append_to_file';
  readonly description = 'Append content to the end of a file';
  readonly parameters = [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file to append to',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content to append to the file',
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

    // Ensure directory exists if file doesn't exist yet
    const dir = join(fullPath, '..');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Append content to file (creates file if it doesn't exist)
    await appendFile(fullPath, args.content, 'utf-8');
    
    context.logger.info(`Appended to file: ${args.path}`, {
      size: args.content.length,
    });

    return `Successfully appended ${args.content.length} bytes to ${args.path}`;
  }
}

export class DeleteFileTool implements Tool<{ path: string }, string> {
  readonly name = 'delete_file';
  readonly description = 'Delete a file from the workspace';
  readonly parameters = [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file to delete',
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

    // Check if file exists
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${args.path}`);
    }

    // Ensure it's a file, not a directory
    const stats = await stat(fullPath);
    if (stats.isDirectory()) {
      throw new Error(`Path is a directory, not a file: ${args.path}`);
    }

    // Delete the file
    await unlink(fullPath);
    
    context.logger.info(`Deleted file: ${args.path}`);

    return `Successfully deleted file: ${args.path}`;
  }
}

export class DownloadFileTool
  implements Tool<{ url: string; filename: string }, string>
{
  readonly name = 'download_file';
  readonly description = 'Download a file from a URL to the workspace';
  readonly parameters = [
    {
      name: 'url',
      type: 'string',
      description: 'URL of the file to download',
      required: true,
    },
    {
      name: 'filename',
      type: 'string',
      description: 'Filename to save as (relative to workspace root)',
      required: true,
    },
  ];

  async invoke(
    args: { url: string; filename: string },
    context: ToolExecutionContext
  ): Promise<string> {
    // Basic URL validation
    if (!args.url.startsWith('http://') && !args.url.startsWith('https://')) {
      throw new Error('Invalid URL: must use http:// or https:// protocol');
    }

    const fullPath = resolve(context.workspaceRoot, args.filename);

    // Security check
    if (!fullPath.startsWith(context.workspaceRoot)) {
      throw new Error('Access denied: path outside workspace');
    }

    // Ensure directory exists
    const dir = join(fullPath, '..');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    context.logger.info(`Downloading file from: ${args.url}`);

    try {
      // Stream the download to avoid memory issues with large files
      const response = await axios({
        method: 'get',
        url: args.url,
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; AutoGPT/1.0; +http://github.com/autogpt)',
        },
      });

      const writer = createWriteStream(fullPath);
      await pipeline(response.data, writer);

      // Get file size
      const stats = await stat(fullPath);
      const fileSize = stats.size;

      context.logger.info(`Downloaded file: ${args.filename}`, {
        size: fileSize,
        url: args.url,
      });

      return `Successfully downloaded ${fileSize} bytes to ${args.filename}`;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Download failed', { error, url: args.url });
      throw new Error(`Failed to download file: ${message}`);
    }
  }
}

