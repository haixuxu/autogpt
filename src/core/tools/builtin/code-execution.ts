import type { Tool, ToolExecutionContext } from '../index';
import {
  DefaultExecutorFactory,
  DEFAULT_SANDBOX_POLICY,
  type CodeExecutionResult,
} from '../../../infra/executor/index';

export class ExecuteCodeTool
  implements Tool<{ language: string; code: string }, CodeExecutionResult>
{
  readonly name = 'execute_code';
  readonly description = 'Execute code in a sandboxed environment';
  readonly parameters = [
    {
      name: 'language',
      type: 'string',
      description: 'Programming language (python, javascript, bash, etc.)',
      required: true,
      enum: ['python', 'javascript', 'bash', 'sh'],
    },
    {
      name: 'code',
      type: 'string',
      description: 'Code to execute',
      required: true,
    },
  ];

  async invoke(
    args: { language: string; code: string },
    context: ToolExecutionContext
  ): Promise<CodeExecutionResult> {
    context.logger.info(`Executing ${args.language} code`, {
      codeLength: args.code.length,
    });

    const factory = new DefaultExecutorFactory();
    const executor = await factory.createLocalSandbox(DEFAULT_SANDBOX_POLICY);

    try {
      const result = await executor.execute({
        language: args.language,
        code: args.code,
        workingDirectory: context.workspaceRoot,
        timeoutMs: 30000,
      });

      context.logger.info('Code execution completed', {
        exitCode: result.exitCode,
        duration: result.durationMs,
      });

      return result;
    } catch (error) {
      context.logger.error('Code execution failed', { error });
      throw error;
    }
  }
}

