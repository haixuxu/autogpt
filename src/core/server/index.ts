export interface AgentProtocolServer {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface ServerFactory {
  create(): AgentProtocolServer;
}
