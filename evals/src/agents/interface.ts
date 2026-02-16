import type { CodingAgent, CodingAgentResponse } from '../types.js';

export type { CodingAgent, CodingAgentResponse };

export function createAgent(name: string): CodingAgent {
  switch (name) {
    case 'mock':
      return {
        name: 'mock',
        async run(prompt: string, workingDir: string): Promise<CodingAgentResponse> {
          const { MockAgent } = await import('./mock.js');
          const agent = new MockAgent();
          return agent.run(prompt, workingDir);
        }
      };
    case 'claude-code':
    default:
      return {
        name: 'claude-code',
        async run(prompt: string, workingDir: string): Promise<CodingAgentResponse> {
          const { ClaudeCodeAgent } = await import('./claude-code.js');
          const agent = new ClaudeCodeAgent();
          return agent.run(prompt, workingDir);
        }
      };
  }
}
