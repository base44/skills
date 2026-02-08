import fs from 'fs/promises';
import path from 'path';
import type { Experiment } from './types.js';

/**
 * Discover experiments from the experiments directory.
 * Each subdirectory is an experiment. Experiments can contain:
 * - CLAUDE.md: Override the project's CLAUDE.md
 * - AGENTS.md: Place an AGENTS.md in the project root
 * - skills/: Directory of skills to use instead of fixture skills
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
      const skills = await getExperimentContents(experimentDir);

      experiments.push({
        name: entry.name,
        skillsDir: experimentDir,
        skills,
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
 * Get contents of an experiment directory (CLAUDE.md, AGENTS.md, and skill names).
 */
async function getExperimentContents(experimentDir: string): Promise<string[]> {
  const contents: string[] = [];

  // Check for CLAUDE.md
  try {
    await fs.access(path.join(experimentDir, 'CLAUDE.md'));
    contents.push('CLAUDE.md');
  } catch {
    // No CLAUDE.md
  }

  // Check for AGENTS.md
  try {
    await fs.access(path.join(experimentDir, 'AGENTS.md'));
    contents.push('AGENTS.md');
  } catch {
    // No AGENTS.md
  }

  // Check for skills directory
  try {
    const skillsDir = path.join(experimentDir, 'skills');
    const skillEntries = await fs.readdir(skillsDir, { withFileTypes: true });
    const skillNames = skillEntries
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name);
    contents.push(...skillNames);
  } catch {
    // No skills directory
  }

  return contents;
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
