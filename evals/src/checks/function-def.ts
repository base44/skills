import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

// Function definition schema based on base44-cli function structure
const FunctionConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  entrypoint: z.string().optional(),
  env: z.array(z.string()).optional(),
  envFrom: z.array(z.string()).optional(),
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

  // Try to find raw JSON object with function-like properties
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

export class FunctionDefCheck implements Check {
  type = 'function-def';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { agentResponse, projectDir } = context;
    const expectedValid = this.config.expectedValid ?? true;

    let functionData: object | null = null;

    if (this.config.target === 'file' && this.config.filePath) {
      try {
        const filePath = path.join(projectDir, this.config.filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const jsonStr = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        functionData = JSON.parse(jsonStr);
      } catch (error) {
        return {
          name: this.config.description,
          passed: !expectedValid,
          details: `Failed to read function file: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    } else {
      functionData = extractJsonFromOutput(agentResponse.output);
    }

    if (!functionData) {
      return {
        name: this.config.description,
        passed: !expectedValid,
        details: 'No function configuration found in output',
      };
    }

    const result = FunctionConfigSchema.safeParse(functionData);

    if (result.success) {
      return {
        name: this.config.description,
        passed: expectedValid,
        details: expectedValid ? 'Valid function definition' : 'Expected invalid but got valid definition',
      };
    } else {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        name: this.config.description,
        passed: !expectedValid,
        details: expectedValid ? `Invalid function definition: ${errors}` : 'Correctly identified as invalid',
      };
    }
  }
}
