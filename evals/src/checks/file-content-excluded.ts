import fs from 'fs/promises';
import path from 'path';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

export class FileContentExcludedCheck implements Check {
  type = 'file-content-excluded';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { projectDir } = context;
    const filePath = this.config.filePath;
    const pattern = this.config.pattern;

    if (!filePath) {
      return {
        name: this.config.description,
        passed: false,
        details: 'No file path specified in check config',
      };
    }

    if (!pattern) {
      return {
        name: this.config.description,
        passed: false,
        details: 'No pattern specified for excluded content check',
      };
    }

    const fullPath = path.join(projectDir, filePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const regex = new RegExp(pattern, 'i');
      const matches = regex.test(content);

      return {
        name: this.config.description,
        passed: !matches,
        details: matches
          ? `Pattern "${pattern}" was found in ${filePath} (should be absent)`
          : `Pattern "${pattern}" correctly absent from ${filePath}`,
      };
    } catch (error) {
      return {
        name: this.config.description,
        passed: false,
        details: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
