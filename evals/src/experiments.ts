import fs from 'fs/promises';
import path from 'path';
import type { Experiment } from './types.js';

/**
 * Discover experiments from the experiments directory.
 * Each subdirectory is an experiment. Experiments can optionally contain CLAUDE.md.
 * Skills are provided by the fixtures themselves, not by experiments.
 */
export async function discoverExperiments(experimentsDir: string): Promise<Experiment[]> {
  const experiments: Experiment[] = [];

  try {
    const entries = await fs.readdir(experimentsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }

      const experimentDir = path.join(experimentsDir, entry.name);
      const hasClaude = await hasClaudeMd(experimentDir);

      experiments.push({
        name: entry.name,
        skillsDir: experimentDir,
        skills: hasClaude ? ['CLAUDE.md'] : [],
      });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  return experiments.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check if experiment directory has a CLAUDE.md file.
 */
async function hasClaudeMd(experimentDir: string): Promise<boolean> {
  try {
    await fs.access(path.join(experimentDir, 'CLAUDE.md'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Filter experiments by name pattern.
 */
export function filterExperiments(experiments: Experiment[], pattern: string): Experiment[] {
  const patternLower = pattern.toLowerCase();
  return experiments.filter(exp =>
    exp.name.toLowerCase().includes(patternLower)
  );
}
