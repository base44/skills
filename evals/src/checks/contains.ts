import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

export class ContainsCheck implements Check {
  type = 'contains';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { agentResponse } = context;
    const searchValue = this.config.value ?? '';

    if (!searchValue) {
      return {
        name: this.config.description,
        passed: false,
        details: 'No search value specified in check config',
      };
    }

    const found = agentResponse.output.toLowerCase().includes(searchValue.toLowerCase());

    return {
      name: this.config.description,
      passed: found,
      details: found ? 'Found in output' : `"${searchValue}" not found in output`,
    };
  }
}
