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
  experimentDir?: string;  // Optional experiment dir for CLAUDE.md override
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

  // Copy skills from each fixture's own skills folder to project/skills
  for (const fixture of fixtures) {
    const fixtureDir = path.join(fixturesDir, fixture);
    const fixtureSkillsSrc = path.join(fixtureDir, 'skills');
    const projectSkillsDest = path.join(fixtureDir, 'project', 'skills');

    // Check if fixture has its own skills folder
    let skillCount = 0;
    try {
      await fs.access(fixtureSkillsSrc);

      // Get list of skills in fixture
      const skillDirs = await fs.readdir(fixtureSkillsSrc, { withFileTypes: true });
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

      // Copy fixture's skills to project/skills
      await copyDir(fixtureSkillsSrc, projectSkillsDest);
    } catch {
      // No skills folder in fixture, skip
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

    if (verbose) {
      const suffix = hasClaude ? ' + CLAUDE.md' : '';
      console.log(`  ✓ ${fixture}: copied ${skillCount} skills${suffix}`);
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
