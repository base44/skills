import { execa } from 'execa';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

export class CommandPassesCheck implements Check {
  type = 'command-passes';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { projectDir } = context;
    const command = this.config.command;

    if (!command) {
      return {
        name: this.config.description,
        passed: false,
        details: 'No command specified in check config',
      };
    }

    try {
      const [cmd, ...args] = command.split(' ');
      const result = await execa(cmd, args, {
        cwd: projectDir,
        timeout: 120000, // 2 minute timeout
        reject: false,
      });

      if (result.exitCode === 0) {
        return {
          name: this.config.description,
          passed: true,
          details: `Command "${command}" passed`,
        };
      } else {
        return {
          name: this.config.description,
          passed: false,
          details: `Command "${command}" failed with exit code ${result.exitCode}: ${result.stderr || result.stdout}`.substring(0, 500),
        };
      }
    } catch (error) {
      return {
        name: this.config.description,
        passed: false,
        details: `Command failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
