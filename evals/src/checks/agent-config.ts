import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

// Agent configuration schema based on base44-cli agent structure
const ToolConfigSchema = z.object({
  name: z.string(),
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

const AgentConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  model: z.string().optional(),
  tool_configs: z.array(ToolConfigSchema).optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
});

function extractJsonFromOutput(output: string): object | null {
  // Try to find JSON in code blocks first
  const codeBlockMatch = output.match(/```(?:json|jsonc)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const jsonStr = codeBlockMatch[1].replace(/\/\/.*$/gm, '').trim();
      return JSON.parse(jsonStr);
    } catch {
      // Continue
    }
  }

  // Try to find raw JSON object with agent-like properties
  const jsonMatch = output.match(/\{[\s\S]*"name"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[0].replace(/\/\/.*$/gm, '');
      return JSON.parse(jsonStr);
    } catch {
      // Continue
    }
  }

  return null;
}

export class AgentConfigCheck implements Check {
  type = 'agent-config';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { agentResponse, projectDir } = context;
    const expectedValid = this.config.expectedValid ?? true;

    let agentData: object | null = null;

    if (this.config.target === 'file' && this.config.filePath) {
      try {
        const filePath = path.join(projectDir, this.config.filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const jsonStr = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        agentData = JSON.parse(jsonStr);
      } catch (error) {
        return {
          name: this.config.description,
          passed: !expectedValid,
          details: `Failed to read agent file: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    } else {
      agentData = extractJsonFromOutput(agentResponse.output);
    }

    if (!agentData) {
      return {
        name: this.config.description,
        passed: !expectedValid,
        details: 'No agent configuration found in output',
      };
    }

    const result = AgentConfigSchema.safeParse(agentData);

    if (result.success) {
      return {
        name: this.config.description,
        passed: expectedValid,
        details: expectedValid ? 'Valid agent configuration' : 'Expected invalid but got valid configuration',
      };
    } else {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        name: this.config.description,
        passed: !expectedValid,
        details: expectedValid ? `Invalid agent configuration: ${errors}` : 'Correctly identified as invalid',
      };
    }
  }
}
