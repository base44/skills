import fs from 'fs/promises';
import path from 'path';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

export class ValidJsonCheck implements Check {
  type = 'valid-json';
  private config: CheckConfig;

  constructor(config: CheckConfig) {
    this.config = config;
  }

  async run(context: EvalContext): Promise<CheckResult> {
    const { projectDir } = context;
    const filePath = this.config.filePath;

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
      // Remove JSONC comments
      const jsonStr = content
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      JSON.parse(jsonStr);

      return {
        name: this.config.description,
        passed: true,
        details: `Valid JSON in ${filePath}`,
      };
    } catch (error) {
      return {
        name: this.config.description,
        passed: false,
        details: `Invalid JSON in ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
