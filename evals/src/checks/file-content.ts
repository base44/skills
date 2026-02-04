import fs from 'fs/promises';
import path from 'path';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

export class FileContentCheck implements Check {
  type = 'file-content';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { projectDir } = context;
    const filePath = this.config.filePath;
    const pattern = this.config.pattern;
    const value = this.config.value;

    if (!filePath) {
      return {
        name: this.config.description,
        passed: false,
        details: 'No file path specified in check config',
      };
    }

    const fullPath = path.join(projectDir, filePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');

      // Check for regex pattern
      if (pattern) {
        const regex = new RegExp(pattern, 'i');
        const matches = regex.test(content);
        return {
          name: this.config.description,
          passed: matches,
          details: matches
            ? `Pattern "${pattern}" found in ${filePath}`
            : `Pattern "${pattern}" not found in ${filePath}`,
        };
      }

      // Check for substring
      if (value) {
        const contains = content.includes(value);
        return {
          name: this.config.description,
          passed: contains,
          details: contains
            ? `"${value}" found in ${filePath}`
            : `"${value}" not found in ${filePath}`,
        };
      }

      return {
        name: this.config.description,
        passed: false,
        details: 'No pattern or value specified for content check',
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
