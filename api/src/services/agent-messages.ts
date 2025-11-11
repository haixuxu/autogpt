import { PrismaClient } from '@prisma/client';
import { broadcastAgentEvent } from './ws-hub.js';

const prisma = new PrismaClient();

export type AgentMessageRole = 'user' | 'assistant' | 'system';
export type AgentMessageType =
  | 'thought'
  | 'action'
  | 'result'
  | 'feedback'
  | 'feedback_request'
  | 'system'
  | 'info';

export interface AgentMessageContent {
  readonly [key: string]: unknown;
}

export interface AgentMessageRecord {
  readonly id: string;
  readonly agentId: string;
  readonly role: AgentMessageRole;
  readonly type: AgentMessageType;
  readonly content: AgentMessageContent;
  readonly createdAt: Date;
  readonly handled: boolean;
  readonly handledAt: Date | null;
  readonly handledBy: string | null;
}

function serializeContent(content: AgentMessageContent): string {
  return JSON.stringify(content ?? {});
}

function deserializeContent(content: string): AgentMessageContent {
  try {
    return JSON.parse(content);
  } catch {
    return { text: content };
  }
}

export async function createAgentMessage(params: {
  agentId: string;
  role: AgentMessageRole;
  type: AgentMessageType;
  content: AgentMessageContent;
  handled?: boolean;
  handledBy?: string | null;
}): Promise<AgentMessageRecord> {
  const { agentId, role, type, content, handled, handledBy } = params;

  const record = await prisma.agentMessage.create({
    data: {
      agentId,
      role,
      type,
      content: serializeContent(content),
      handled: handled ?? false,
      handledBy: handledBy ?? null,
      handledAt: handled ? new Date() : null,
    },
  });

  const payload: AgentMessageRecord = {
    id: record.id,
    agentId: record.agentId,
    role: record.role as AgentMessageRole,
    type: record.type as AgentMessageType,
    content: deserializeContent(record.content),
    createdAt: record.createdAt,
    handled: record.handled,
    handledAt: record.handledAt,
    handledBy: record.handledBy,
  };

  broadcastAgentEvent({
    type: 'agent_event',
    agentId,
    event: {
      id: payload.id,
      role: payload.role,
      messageType: payload.type,
      content: payload.content,
      createdAt: payload.createdAt,
      handled: payload.handled,
    },
  });

  return payload;
}

export async function listAgentMessages(agentId: string, options?: {
  limit?: number;
  cursor?: string;
}): Promise<AgentMessageRecord[]> {
  const messages = await prisma.agentMessage.findMany({
    where: { agentId },
    orderBy: { createdAt: 'asc' },
    take: options?.limit ?? 200,
    ...(options?.cursor
      ? {
          skip: 1,
          cursor: { id: options.cursor },
        }
      : {}),
  });

  return messages.map((message) => ({
    id: message.id,
    agentId: message.agentId,
    role: message.role as AgentMessageRole,
    type: message.type as AgentMessageType,
    content: deserializeContent(message.content),
    createdAt: message.createdAt,
    handled: message.handled,
    handledAt: message.handledAt,
    handledBy: message.handledBy,
  }));
}

export async function getPendingFeedbackMessages(
  agentId: string
): Promise<AgentMessageRecord[]> {
  const messages = await prisma.agentMessage.findMany({
    where: {
      agentId,
      role: 'user',
      type: 'feedback',
      handled: false,
    },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map((message) => ({
    id: message.id,
    agentId: message.agentId,
    role: message.role as AgentMessageRole,
    type: message.type as AgentMessageType,
    content: deserializeContent(message.content),
    createdAt: message.createdAt,
    handled: message.handled,
    handledAt: message.handledAt,
    handledBy: message.handledBy,
  }));
}

export async function markMessagesHandled(
  messageIds: string[],
  handler: string
): Promise<void> {
  if (messageIds.length === 0) {
    return;
  }

  await prisma.agentMessage.updateMany({
    where: {
      id: { in: messageIds },
    },
    data: {
      handled: true,
      handledAt: new Date(),
      handledBy: handler,
    },
  });
}

