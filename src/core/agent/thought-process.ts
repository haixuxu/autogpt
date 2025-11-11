import type { LlmProvider } from '../../infra/llm/index';
import type { LlmConfig } from '../config/index';
import type { Tool } from '../tools/index';
import type {
  ThoughtProcess,
  ThoughtInputs,
  PromptPayload,
  ThoughtResponsePayload,
} from './thought';
import type { ActionProposal } from './actions';
import {
  buildSystemPrompt,
  buildTaskPrompt,
  formatToolsAsFunctions,
} from './prompts';

export class DefaultThoughtProcess implements ThoughtProcess {
  constructor(
    private provider: LlmProvider,
    private config: LlmConfig,
    private tools: Tool[]
  ) {}

  async preparePrompt(inputs: ThoughtInputs): Promise<PromptPayload> {
    const systemPrompt = buildSystemPrompt(inputs.directives);
    const taskPrompt = buildTaskPrompt(inputs, this.tools);

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: taskPrompt },
      ],
      functions: formatToolsAsFunctions(this.tools),
      temperature: this.config.temperature,
      model: this.config.model,
    };
  }

  async parseResponse(
    response: ThoughtResponsePayload
  ): Promise<ActionProposal> {
    const now = Date.now();

    // If LLM used function calling
    if (response.parsed && typeof response.parsed === 'object') {
      const parsed = response.parsed as {
        name?: string;
        arguments?: string | Record<string, unknown>;
        reasoning?: string[];
        plan?: string[];
      };

      let args: Record<string, unknown> = {};
      if (typeof parsed.arguments === 'string') {
        try {
          args = JSON.parse(parsed.arguments);
        } catch {
          args = { raw: parsed.arguments };
        }
      } else if (parsed.arguments) {
        args = parsed.arguments;
      }

      return {
        command: parsed.name || 'unknown',
        arguments: args,
        reasoning: parsed.reasoning || [response.raw],
        plan: parsed.plan,
        metadata: {
          createdAt: now,
          cycle: 0, // Will be set by agent loop
          source: 'agent',
        },
      };
    }

    // Fallback: try to parse from raw text
    return this.parseFallback(response.raw, now);
  }

  private parseFallback(raw: string, timestamp: number): ActionProposal {
    // Try to extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          command: parsed.command || parsed.tool || 'unknown',
          arguments: parsed.arguments || parsed.args || {},
          reasoning: Array.isArray(parsed.reasoning)
            ? parsed.reasoning
            : [parsed.reasoning || raw],
          plan: parsed.plan,
          metadata: {
            createdAt: timestamp,
            cycle: 0,
            source: 'agent',
          },
        };
      } catch {
        // Ignore parse error, fall through
      }
    }

    // Ultimate fallback: treat as a thought with no action
    return {
      command: 'task_complete',
      arguments: { summary: raw },
      reasoning: [raw],
      metadata: {
        createdAt: timestamp,
        cycle: 0,
        source: 'agent',
      },
    };
  }
}

