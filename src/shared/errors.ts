export class AutoGPTError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AutoGPTError';
    Object.setPrototypeOf(this, AutoGPTError.prototype);
  }
}

export class LlmProviderError extends AutoGPTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'LLM_PROVIDER_ERROR', context, true); // Retryable
    this.name = 'LlmProviderError';
  }
}

export class ToolExecutionError extends AutoGPTError {
  constructor(
    message: string,
    public readonly toolName: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'TOOL_EXECUTION_ERROR', { ...context, toolName }, false);
    this.name = 'ToolExecutionError';
  }
}

export class MemoryError extends AutoGPTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'MEMORY_ERROR', context, true);
    this.name = 'MemoryError';
  }
}

export class ConfigurationError extends AutoGPTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', context, false);
    this.name = 'ConfigurationError';
  }
}

export class PluginError extends AutoGPTError {
  constructor(
    message: string,
    public readonly pluginName: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'PLUGIN_ERROR', { ...context, pluginName }, false);
    this.name = 'PluginError';
  }
}

export class TimeoutError extends AutoGPTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', context, true);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends AutoGPTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', context, true);
    this.name = 'NetworkError';
  }
}

