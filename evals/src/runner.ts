import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type {
  CodingAgent,
  EvalConfig,
  EvalRunResult,
  FixtureResult,
  SuiteResult,
} from './types.js';
import { createCheck, initializeChecks } from './checks/interface.js';

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
      await fs.symlink(link, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function loadEvalConfig(fixtureDir: string): Promise<EvalConfig> {
  const configPath = path.join(fixtureDir, 'eval.json');
  const content = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(content) as EvalConfig;
}

async function runFixture(
  agent: CodingAgent,
  fixtureDir: string,
  verbose: boolean
): Promise<FixtureResult> {
  const config = await loadEvalConfig(fixtureDir);

  // Create temp directory and copy fixture
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eval-'));
  await copyDir(fixtureDir, tempDir);

  // Determine project directory (default to fixture root if no project/ subdirectory)
  let projectDir = tempDir;
  try {
    const projectSubdir = path.join(tempDir, 'project');
    const stat = await fs.stat(projectSubdir);
    if (stat.isDirectory()) {
      projectDir = projectSubdir;
    }
  } catch {
    // No project/ subdirectory, use fixture root
  }

  if (verbose) {
    console.log(`  Running fixture: ${config.name}`);
    console.log(`  Temp dir: ${tempDir}`);
    console.log(`  Project dir: ${projectDir}`);
  }

  try {
    // Run the agent
    const agentResponse = await agent.run(config.prompt, projectDir);

    if (verbose) {
      console.log(`  Skills invoked: ${agentResponse.skillsInvoked.join(', ') || '(none)'}`);
      console.log(`  --- Agent Output ---`);
      console.log(agentResponse.output);
      console.log(`  --- End Output ---`);
    }

    // Check skill activation
    const skillCheckPassed = config.expectedSkills.every(
      skill => agentResponse.skillsInvoked.includes(skill)
    );

    // Run all checks
    const checkResults = await Promise.all(
      config.checks.map(async checkConfig => {
        const check = createCheck(checkConfig);
        return check.run({
          agentResponse,
          fixtureDir,
          projectDir,
          checkConfig,
        });
      })
    );

    // Determine overall pass/fail
    const allChecksPassed = checkResults.every(r => r.passed);
    const passed = skillCheckPassed && allChecksPassed;

    return {
      name: config.name,
      description: config.description,
      fixtureDir: path.relative(process.cwd(), fixtureDir),
      prompt: config.prompt,
      expectedSkills: config.expectedSkills,
      skillsInvoked: agentResponse.skillsInvoked,
      skillCheckPassed,
      checks: checkResults,
      passed,
      agentOutput: agentResponse.output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: config.name,
      description: config.description,
      fixtureDir: path.relative(process.cwd(), fixtureDir),
      prompt: config.prompt,
      expectedSkills: config.expectedSkills,
      skillsInvoked: [],
      skillCheckPassed: false,
      checks: [],
      passed: false,
      agentOutput: '',
      error: errorMessage,
    };
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

export async function discoverFixtures(baseDir: string): Promise<string[]> {
  const fixtures: string[] = [];

  async function scan(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    // Check if this directory is a fixture (has eval.json)
    const hasEvalJson = entries.some(e => e.isFile() && e.name === 'eval.json');
    if (hasEvalJson) {
      fixtures.push(dir);
      return; // Don't recurse into fixtures
    }

    // Recurse into subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await scan(path.join(dir, entry.name));
      }
    }
  }

  await scan(baseDir);
  return fixtures.sort();
}

function groupFixturesBySuite(fixtures: string[]): Map<string, string[]> {
  const suites = new Map<string, string[]>();

  for (const fixture of fixtures) {
    // Extract suite name from path (e.g., fixtures/entities/basic-entity -> entities)
    const parts = fixture.split(path.sep);
    const fixturesIndex = parts.indexOf('fixtures');
    const suiteName = fixturesIndex >= 0 && parts.length > fixturesIndex + 1
      ? parts[fixturesIndex + 1]
      : 'default';

    if (!suites.has(suiteName)) {
      suites.set(suiteName, []);
    }
    suites.get(suiteName)!.push(fixture);
  }

  return suites;
}

export interface RunOptions {
  name?: string;
  fixturesDir?: string;
  verbose?: boolean;
  filter?: string;
  fixtures?: string[];
}

export async function runEvals(
  agent: CodingAgent,
  options: RunOptions = {}
): Promise<EvalRunResult> {
  const {
    name = 'default',
    fixturesDir = 'fixtures',
    verbose = false,
    filter,
    fixtures: fixtureNames,
  } = options;

  // Initialize check registry
  await initializeChecks();

  // Discover fixtures
  let fixtures = await discoverFixtures(fixturesDir);

  // Filter by specific fixture names if provided
  if (fixtureNames && fixtureNames.length > 0) {
    fixtures = fixtures.filter(f => {
      const fixtureName = path.basename(f);
      return fixtureNames.some(name =>
        fixtureName === name || fixtureName.includes(name)
      );
    });
  }

  // Apply filter pattern if specified
  if (filter) {
    const filterLower = filter.toLowerCase();
    fixtures = fixtures.filter(f => f.toLowerCase().includes(filterLower));
  }

  if (verbose) {
    console.log(`Found ${fixtures.length} fixtures`);
  }

  // Group by suite
  const suiteMap = groupFixturesBySuite(fixtures);
  const suites: SuiteResult[] = [];

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [suiteName, suiteFixtures] of suiteMap) {
    if (verbose) {
      console.log(`\nRunning suite: ${suiteName}`);
    }

    const fixtureResults: FixtureResult[] = [];

    for (const fixtureDir of suiteFixtures) {
      const result = await runFixture(agent, fixtureDir, verbose);
      fixtureResults.push(result);

      if (result.passed) {
        totalPassed++;
        if (verbose) {
          console.log(`  ✅ ${result.name}`);
        }
      } else {
        totalFailed++;
        if (verbose) {
          console.log(`  ❌ ${result.name}`);
          if (result.error) {
            console.log(`     Error: ${result.error}`);
          }
        }
      }
    }

    suites.push({
      name: suiteName,
      fixtures: fixtureResults,
      passed: fixtureResults.filter(f => f.passed).length,
      failed: fixtureResults.filter(f => !f.passed).length,
    });
  }

  return {
    name,
    date: new Date(),
    agent: agent.name,
    suites,
    totalPassed,
    totalFailed,
  };
}
