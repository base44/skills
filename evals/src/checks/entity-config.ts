import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

// Entity schema based on base44-cli entity structure
const PropertySchema = z.object({
  type: z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object', 'binary']),
  description: z.string().optional(),
  format: z.string().optional(),
  enum: z.array(z.any()).optional(),
  default: z.any().optional(),
  items: z.object({
    type: z.string(),
  }).optional(),
  properties: z.record(z.any()).optional(),
});

const RLSConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'neq', 'in', 'nin', 'exists']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]),
}).or(z.object({
  any: z.array(z.any()),
})).or(z.object({
  all: z.array(z.any()),
}));

const RLSSchema = z.object({
  read: RLSConditionSchema.optional(),
  create: RLSConditionSchema.optional(),
  update: RLSConditionSchema.optional(),
  delete: RLSConditionSchema.optional(),
});

const EntitySchema = z.object({
  name: z.string().min(1),
  type: z.literal('object').optional(),
  description: z.string().optional(),
  properties: z.record(PropertySchema),
  required: z.array(z.string()).optional(),
  rls: RLSSchema.optional(),
});

function extractJsonFromOutput(output: string): object | null {
  // Try to find JSON in code blocks first
  const codeBlockMatch = output.match(/```(?:json|jsonc)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      // Remove comments for JSONC
      const jsonStr = codeBlockMatch[1].replace(/\/\/.*$/gm, '').trim();
      return JSON.parse(jsonStr);
    } catch {
      // Continue to try other methods
    }
  }

  // Try to find raw JSON object
  const jsonMatch = output.match(/\{[\s\S]*"name"[\s\S]*"properties"[\s\S]*\}/);
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

export class EntityConfigCheck implements Check {
  type = 'entity-config';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { agentResponse, projectDir } = context;
    const expectedValid = this.config.expectedValid ?? true;

    let entityData: object | null = null;

    if (this.config.target === 'file' && this.config.filePath) {
      // Read from file
      try {
        const filePath = path.join(projectDir, this.config.filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        // Remove JSONC comments
        const jsonStr = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        entityData = JSON.parse(jsonStr);
      } catch (error) {
        return {
          name: this.config.description,
          passed: !expectedValid,
          details: `Failed to read entity file: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    } else {
      // Extract from output
      entityData = extractJsonFromOutput(agentResponse.output);
    }

    if (!entityData) {
      return {
        name: this.config.description,
        passed: !expectedValid,
        details: 'No entity configuration found in output',
      };
    }

    const result = EntitySchema.safeParse(entityData);

    if (result.success) {
      return {
        name: this.config.description,
        passed: expectedValid,
        details: expectedValid ? 'Valid entity schema' : 'Expected invalid but got valid schema',
      };
    } else {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        name: this.config.description,
        passed: !expectedValid,
        details: expectedValid ? `Invalid entity schema: ${errors}` : 'Correctly identified as invalid',
      };
    }
  }
}
