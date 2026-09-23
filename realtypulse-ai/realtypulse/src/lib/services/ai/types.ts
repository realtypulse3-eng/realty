export interface AgentExecutionInput {
  agentKey: string;
  organizationId: string;
  triggeredBy: string;
  payload?: Record<string, unknown>;
}

export interface AgentExecutionResult {
  ok: boolean;
  output?: Record<string, unknown>;
  error?: string;
}

/**
 * A model provider is anything that can turn an agent's prompt + payload
 * into a result. Swap in a real implementation (Anthropic, OpenAI, etc.)
 * without touching the agent service or the UI.
 */
export interface ModelProvider {
  isConfigured(): boolean;
  run(input: AgentExecutionInput & { prompt: string }): Promise<AgentExecutionResult>;
}
