import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

export type { Check, CheckConfig, CheckResult, EvalContext };

// Registry of check implementations
const checkRegistry: Map<string, (config: CheckConfig) => Check> = new Map();

export function registerCheck(type: string, factory: (config: CheckConfig) => Check): void {
  checkRegistry.set(type, factory);
}

export function createCheck(config: CheckConfig): Check {
  const factory = checkRegistry.get(config.type);
  if (!factory) {
    throw new Error(`Unknown check type: ${config.type}`);
  }
  return factory(config);
}

export function getRegisteredCheckTypes(): string[] {
  return Array.from(checkRegistry.keys());
}

// Initialize checks - this will be called when the module is loaded
export async function initializeChecks(): Promise<void> {
  const { EntityConfigCheck } = await import('./entity-config.js');
  const { FunctionDefCheck } = await import('./function-def.js');
  const { AgentConfigCheck } = await import('./agent-config.js');
  const { ContainsCheck } = await import('./contains.js');
  const { JsonSchemaCheck } = await import('./json-schema.js');
  const { FileExistsCheck } = await import('./file-exists.js');
  const { FileContentCheck } = await import('./file-content.js');
  const { CommandPassesCheck } = await import('./command-passes.js');
  const { ValidJsonCheck } = await import('./valid-json.js');
  const { FileContentExcludedCheck } = await import('./file-content-excluded.js');

  registerCheck('entity-config', (config) => new EntityConfigCheck(config));
  registerCheck('function-def', (config) => new FunctionDefCheck(config));
  registerCheck('agent-config', (config) => new AgentConfigCheck(config));
  registerCheck('contains', (config) => new ContainsCheck(config));
  registerCheck('json-schema', (config) => new JsonSchemaCheck(config));
  registerCheck('file-exists', (config) => new FileExistsCheck(config));
  registerCheck('file-content', (config) => new FileContentCheck(config));
  registerCheck('file-content-excluded', (config) => new FileContentExcludedCheck(config));
  registerCheck('command-passes', (config) => new CommandPassesCheck(config));
  registerCheck('valid-json', (config) => new ValidJsonCheck(config));
}
