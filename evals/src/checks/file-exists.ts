import fs from 'fs/promises';
import path from 'path';
import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

export class FileExistsCheck implements Check {
  type = 'file-exists';
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
      await fs.access(fullPath);
      return {
        name: this.config.description,
        passed: true,
        details: `File exists: ${filePath}`,
      };
    } catch {
      return {
        name: this.config.description,
        passed: false,
        details: `File not found: ${filePath}`,
      };
    }
  }
}
