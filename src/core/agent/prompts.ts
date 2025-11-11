import type { DirectiveBundle, ThoughtInputs } from './thought';
import type { Tool } from '../tools/index';

export function buildSystemPrompt(directives: DirectiveBundle): string {
  const { constraints, resources, bestPractices } = directives;

  return `You are AutoGPT, an autonomous AI agent designed to accomplish tasks.

CONSTRAINTS:
${constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

RESOURCES:
${resources.map((r, i) => `${i + 1}. ${r}`).join('\n')}

BEST PRACTICES:
${bestPractices.map((bp, i) => `${i + 1}. ${bp}`).join('\n')}

You should respond with your thoughts, reasoning, plan, and the command you want to execute.
Always think step by step and explain your reasoning.`;
}

export function buildTaskPrompt(inputs: ThoughtInputs, tools: Tool[]): string {
  const { task, cycle, memory, userFeedback } = inputs;

  let prompt = `TASK: ${task}\n\nCYCLE: ${cycle}\n\n`;

  // Add memory context
  if (memory.shortTerm.length > 0) {
    prompt += 'RECENT MEMORY:\n';
    memory.shortTerm.slice(-5).forEach((m) => {
      prompt += `- [${m.type}] ${m.content}\n`;
    });
    prompt += '\n';
  }

  if (memory.longTerm.length > 0) {
    prompt += 'RELEVANT PAST EXPERIENCE:\n';
    memory.longTerm.slice(0, 3).forEach((m) => {
      prompt += `- ${m.content}\n`;
    });
    prompt += '\n';
  }

  // Add user feedback if provided
  if (userFeedback) {
    prompt += `USER FEEDBACK: ${userFeedback}\n\n`;
  }

  // Add available tools
  prompt += 'AVAILABLE TOOLS:\n';
  tools.forEach((tool) => {
    prompt += `- ${tool.name}: ${tool.description}\n`;
    if (tool.parameters) {
      prompt += `  Parameters: ${tool.parameters.map((p) => `${p.name}${p.required ? '*' : ''} (${p.type})`).join(', ')}\n`;
    }
  });

  return prompt;
}

export function formatToolsAsFunctions(tools: Tool[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters?.reduce(
        (acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum ? { enum: param.enum } : {}),
          };
          return acc;
        },
        {} as Record<string, unknown>
      ),
      required: tool.parameters
        ?.filter((p) => p.required)
        .map((p) => p.name),
    },
  }));
}

export const DEFAULT_DIRECTIVES: DirectiveBundle = {
  constraints: [
    'You must use the available tools to accomplish your task',
    'You cannot interact directly with users except through tool outputs',
    'You must break down complex tasks into smaller, manageable steps',
    'You should verify the results of your actions before proceeding',
  ],
  resources: [
    'Filesystem access within the workspace',
    'Web search and browsing capabilities',
    'Code execution in a sandboxed environment',
    'Long-term and short-term memory',
  ],
  bestPractices: [
    'Always explain your reasoning before taking action',
    'Create a plan and follow it systematically',
    'Learn from past failures and adapt your approach',
    'Be efficient and avoid unnecessary actions',
  ],
};

