import { z } from 'zod';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

function extractJsonFromOutput(output: string): unknown | null {
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

  // Try to find raw JSON
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[0].replace(/\/\/.*$/gm, '');
      return JSON.parse(jsonStr);
    } catch {
      // Continue
    }
  }

  // Try array
  const arrayMatch = output.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      // Continue
    }
  }

  return null;
}

// Simple JSON schema to Zod converter for basic schemas
function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodType {
  const type = schema.type as string;

  switch (type) {
    case 'string':
      return z.string();
    case 'number':
    case 'integer':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'array': {
      const items = schema.items as Record<string, unknown> | undefined;
      if (items) {
        return z.array(jsonSchemaToZod(items));
      }
      return z.array(z.unknown());
    }
    case 'object': {
      const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
      const required = schema.required as string[] | undefined;

      if (properties) {
        const shape: Record<string, z.ZodType> = {};
        for (const [key, propSchema] of Object.entries(properties)) {
          const zodType = jsonSchemaToZod(propSchema);
          shape[key] = required?.includes(key) ? zodType : zodType.optional();
        }
        return z.object(shape);
      }
      return z.record(z.unknown());
    }
    default:
      return z.unknown();
  }
}

export class JsonSchemaCheck implements Check {
  type = 'json-schema';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { agentResponse } = context;

    if (!this.config.schema) {
      return {
        name: this.config.description,
        passed: false,
        details: 'No schema specified in check config',
      };
    }

    const data = extractJsonFromOutput(agentResponse.output);

    if (data === null) {
      return {
        name: this.config.description,
        passed: false,
        details: 'No JSON found in output',
      };
    }

    try {
      const zodSchema = jsonSchemaToZod(this.config.schema);
      const result = zodSchema.safeParse(data);

      if (result.success) {
        return {
          name: this.config.description,
          passed: true,
          details: 'Output matches schema',
        };
      } else {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return {
          name: this.config.description,
          passed: false,
          details: `Schema validation failed: ${errors}`,
        };
      }
    } catch (error) {
      return {
        name: this.config.description,
        passed: false,
        details: `Schema conversion error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
