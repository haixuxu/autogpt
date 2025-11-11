import type WebSocket from 'ws';

type AgentClients = Map<string, Set<WebSocket>>;

const agentClients: AgentClients = new Map();
const socketSubscriptions = new Map<WebSocket, Set<string>>();

export interface AgentEventPayload {
  readonly type: string;
  readonly agentId: string;
  readonly event: Record<string, unknown>;
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
}

export function subscribeAgent(socket: WebSocket, agentId: string): void {
  addClient(agentId, socket);
}

export function unsubscribeSocket(socket: WebSocket): void {
  removeClient(socket);
}

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

