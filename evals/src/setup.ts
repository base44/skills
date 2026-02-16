#!/usr/bin/env node

/**
 * Setup script that copies skills from fixture's own skills folder to project/.
 * Experiments can optionally provide CLAUDE.md to override behavior.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const defaultFixturesDir = path.join(rootDir, 'fixtures');

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const link = await fs.readlink(srcPath);
      try {
        await fs.unlink(destPath);
      } catch {
        // Ignore if doesn't exist
      }
      await fs.symlink(link, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export interface SetupOptions {
  fixturesDir?: string;
  experimentDir?: string;  // Optional experiment dir for CLAUDE.md and skills override
  verbose?: boolean;
}

export async function setupFixtures(options: SetupOptions = {}): Promise<void> {
  const {
    fixturesDir = defaultFixturesDir,
    experimentDir,
    verbose = true,
  } = options;

  if (verbose) {
    console.log('Setting up fixtures...');
  }

  // Get list of fixtures
  const fixtureDirs = await fs.readdir(fixturesDir, { withFileTypes: true });
  const fixtures = fixtureDirs
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name);

  if (verbose) {
    console.log(`Found fixtures: ${fixtures.join(', ')}`);
  }

  // Determine skills source: experiment skills override fixture skills
  let experimentSkillsSrc: string | null = null;
  let experimentSkillNames: string[] = [];
  if (experimentDir) {
    const expSkillsPath = path.join(experimentDir, 'skills');
    try {
      await fs.access(expSkillsPath);
      const skillDirs = await fs.readdir(expSkillsPath, { withFileTypes: true });
      experimentSkillNames = skillDirs
        .filter(d => d.isDirectory() && !d.name.startsWith('.'))
        .map(d => d.name);
      if (experimentSkillNames.length > 0) {
        experimentSkillsSrc = expSkillsPath;
        if (verbose) {
          console.log(`Using experiment skills: ${experimentSkillNames.join(', ')}`);
        }
      }
    } catch {
      // No skills in experiment, will use fixture skills
    }
  }

  // Copy skills to each fixture's project/skills
  for (const fixture of fixtures) {
    const fixtureDir = path.join(fixturesDir, fixture);
    const fixtureSkillsSrc = path.join(fixtureDir, 'skills');
    const projectSkillsDest = path.join(fixtureDir, 'project', 'skills');

    // Use experiment skills if available, otherwise fixture skills
    const skillsSrc = experimentSkillsSrc ?? fixtureSkillsSrc;

    // Check if skills source exists
    let skillCount = 0;
    try {
      await fs.access(skillsSrc);

      // Get list of skills
      const skillDirs = await fs.readdir(skillsSrc, { withFileTypes: true });
      const skills = skillDirs
        .filter(d => d.isDirectory() && !d.name.startsWith('.'))
        .map(d => d.name);
      skillCount = skills.length;

      // Remove existing project skills directory
      try {
        await fs.rm(projectSkillsDest, { recursive: true, force: true });
      } catch {
        // Ignore
      }

      // Copy skills to project/skills
      await copyDir(skillsSrc, projectSkillsDest);
    } catch {
      // No skills folder found, skip
      if (verbose) {
        console.log(`  ⚠ ${fixture}: no skills folder found`);
      }
      continue;
    }

    // Handle CLAUDE.md from experiment (if provided)
    const destClaudeMd = path.join(fixtureDir, 'project', 'CLAUDE.md');
    let hasClaude = false;

    if (experimentDir) {
      const srcClaudeMd = path.join(experimentDir, 'CLAUDE.md');
      try {
        await fs.access(srcClaudeMd);
        await fs.copyFile(srcClaudeMd, destClaudeMd);
        hasClaude = true;
      } catch {
        // No CLAUDE.md in experiment, remove any existing one
        try {
          await fs.unlink(destClaudeMd);
        } catch {
          // Ignore if doesn't exist
        }
      }
    } else {
      // No experiment, remove any existing CLAUDE.md
      try {
        await fs.unlink(destClaudeMd);
      } catch {
        // Ignore if doesn't exist
      }
    }

    // Handle AGENTS.md from experiment (if provided)
    const destAgentsMd = path.join(fixtureDir, 'project', 'AGENTS.md');
    let hasAgents = false;

    if (experimentDir) {
      const srcAgentsMd = path.join(experimentDir, 'AGENTS.md');
      try {
        await fs.access(srcAgentsMd);
        await fs.copyFile(srcAgentsMd, destAgentsMd);
        hasAgents = true;
      } catch {
        // No AGENTS.md in experiment, remove any existing one
        try {
          await fs.unlink(destAgentsMd);
        } catch {
          // Ignore if doesn't exist
        }
      }
    } else {
      // No experiment, remove any existing AGENTS.md
      try {
        await fs.unlink(destAgentsMd);
      } catch {
        // Ignore if doesn't exist
      }
    }

    if (verbose) {
      const mdFiles = [hasClaude && 'CLAUDE.md', hasAgents && 'AGENTS.md'].filter(Boolean);
      const suffix = mdFiles.length > 0 ? ` + ${mdFiles.join(', ')}` : '';
      const source = experimentSkillsSrc ? ' (from experiment)' : '';
      console.log(`  ✓ ${fixture}: copied ${skillCount} skills${source}${suffix}`);
    }
  }

  if (verbose) {
    console.log('Setup complete!');
  }
}

async function setup(): Promise<void> {
  try {
    await setupFixtures();
  } catch (error) {
    console.error('Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule = process.argv[1]?.includes('setup');
if (isMainModule) {
  setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}
