import type WebSocket from 'ws';

type AgentClients = Map<string, Set<WebSocket>>;

const agentClients: AgentClients = new Map();
const socketSubscriptions = new Map<WebSocket, Set<string>>();
const allClients = new Set<WebSocket>();

// Legacy event payload for backward compatibility
export interface AgentEventPayload {
  readonly type: string;
  readonly agentId: string;
  readonly event: Record<string, unknown>;
}

// New Agent Protocol event format
export interface AgentProtocolEvent {
  readonly type:
    | 'task.created'
    | 'task.started'
    | 'task.completed'
    | 'task.failed'
    | 'task.cancelled'
    | 'task.paused'
    | 'task.resumed'
    | 'step.created'
    | 'step.started'
    | 'step.running'
    | 'step.completed'
    | 'step.failed'
    | 'artifact.created'
    | 'log'
    | string; // Allow custom event types
  readonly task_id: string;
  readonly step_id?: string;
  readonly artifact_id?: string;
  readonly data: Record<string, unknown> | string;
  readonly timestamp: string;
}

function addClient(agentId: string, socket: WebSocket): void {
  if (!agentClients.has(agentId)) {
    agentClients.set(agentId, new Set());
  }
  agentClients.get(agentId)!.add(socket);

  if (!socketSubscriptions.has(socket)) {
    socketSubscriptions.set(socket, new Set());
  }
  socketSubscriptions.get(socket)!.add(agentId);

  // Track all clients globally
  allClients.add(socket);
}

function removeClient(socket: WebSocket, agentId?: string): void {
  if (agentId) {
    const clients = agentClients.get(agentId);
    if (clients) {
      clients.delete(socket);
      if (clients.size === 0) {
        agentClients.delete(agentId);
      }
    }
  } else {
    const subscriptions = socketSubscriptions.get(socket);
    if (subscriptions) {
      subscriptions.forEach((subscribedAgentId) => {
        removeClient(socket, subscribedAgentId);
      });
    }
  }
  socketSubscriptions.delete(socket);
  allClients.delete(socket);
}

export function subscribeAgent(socket: WebSocket, agentId: string): void {
  addClient(agentId, socket);
}

export function unsubscribeSocket(socket: WebSocket): void {
  removeClient(socket);
}

// Legacy broadcast for backward compatibility
export function broadcastAgentEvent(payload: AgentEventPayload): void {
  const { agentId } = payload;
  const clients = agentClients.get(agentId);
  if (!clients || clients.size === 0) {
    return;
  }

  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

// Broadcast Agent Protocol event to all clients subscribed to a task
export function broadcastToTask(taskId: string, event: AgentProtocolEvent): void {
  const clients = agentClients.get(taskId);
  if (!clients || clients.size === 0) {
    return;
  }

  const message = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

// Broadcast Agent Protocol event to all connected clients
export function broadcast(event: AgentProtocolEvent): void {
  if (allClients.size === 0) {
    return;
  }

  const message = JSON.stringify(event);
  for (const client of allClients) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

// Export a hub object for easy access to all functions
export const wsHub = {
  subscribeAgent,
  unsubscribeSocket,
  broadcastAgentEvent,
  broadcastToTask,
  broadcast,
};

