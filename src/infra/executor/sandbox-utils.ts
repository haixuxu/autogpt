import { resolve, relative } from 'path';

export function validatePath(path: string, workspaceRoot: string): boolean {
  const normalizedPath = resolve(workspaceRoot, path);
  const relativePath = relative(workspaceRoot, normalizedPath);
  
  // Check if path is within workspace (no '..' escaping)
  return !relativePath.startsWith('..') && !normalizedPath.startsWith('..');
}

export function truncateOutput(output: string, maxLength: number = 8000): string {
  if (output.length <= maxLength) {
    return output;
  }
  
  const truncated = output.substring(0, maxLength);
  const remaining = output.length - maxLength;
  return `${truncated}\n\n... [truncated ${remaining} more characters]`;
}

export function sanitizeEnvironment(env: Record<string, string>): Record<string, string> {
  const allowedKeys = ['PATH', 'HOME', 'USER', 'SHELL', 'LANG', 'TZ'];
  const sanitized: Record<string, string> = {};
  
  for (const key of allowedKeys) {
    if (env[key]) {
      sanitized[key] = env[key];
    }
  }
  
  return sanitized;
}

export function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Execution timeout after ${ms}ms`)), ms);
  });
}

