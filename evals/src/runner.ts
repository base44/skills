import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type {
  CodingAgent,
  EvalConfig,
  ExpandedFixture,
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

export async function expandFixtures(fixtureDirs: string[]): Promise<ExpandedFixture[]> {
  const expanded: ExpandedFixture[] = [];

  for (const fixtureDir of fixtureDirs) {
    const config = await loadEvalConfig(fixtureDir);

    if (config.prompts && config.prompts.length > 0) {
      // Multi-prompt fixture
      for (const promptConfig of config.prompts) {
        expanded.push({
          name: promptConfig.name,
          description: promptConfig.description || config.description,
          fixtureDir,
          prompt: promptConfig.prompt,
          expectedSkills: promptConfig.expectedSkills,
          checks: promptConfig.checks,
        });
      }
    } else if (config.prompt) {
      // Single-prompt fixture (backward compat)
      expanded.push({
        name: config.name,
        description: config.description,
        fixtureDir,
        prompt: config.prompt,
        expectedSkills: config.expectedSkills || [],
        checks: config.checks || [],
      });
    }
  }

  return expanded;
}

async function runFixture(
  agent: CodingAgent,
  fixture: ExpandedFixture,
  verbose: boolean
): Promise<FixtureResult> {
  const { fixtureDir } = fixture;

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
    console.log(`  Running fixture: ${fixture.name}`);
    console.log(`  Temp dir: ${tempDir}`);
    console.log(`  Project dir: ${projectDir}`);
  }

  try {
    // Run the agent
    const agentResponse = await agent.run(fixture.prompt, projectDir);

    if (verbose) {
      console.log(`  Skills invoked: ${agentResponse.skillsInvoked.join(', ') || '(none)'}`);
      console.log(`  --- Agent Output ---`);
      console.log(agentResponse.output);
      console.log(`  --- End Output ---`);
    }

    // Check skill activation
    const skillCheckPassed = fixture.expectedSkills.every(
      skill => agentResponse.skillsInvoked.includes(skill)
    );

    // Run all checks
    const checkResults = await Promise.all(
      fixture.checks.map(async checkConfig => {
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
      name: fixture.name,
      description: fixture.description,
      fixtureDir: path.relative(process.cwd(), fixtureDir),
      prompt: fixture.prompt,
      expectedSkills: fixture.expectedSkills,
      skillsInvoked: agentResponse.skillsInvoked,
      skillCheckPassed,
      checks: checkResults,
      passed,
      agentOutput: agentResponse.output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: fixture.name,
      description: fixture.description,
      fixtureDir: path.relative(process.cwd(), fixtureDir),
      prompt: fixture.prompt,
      expectedSkills: fixture.expectedSkills,
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

async function runPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const worker = async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

function groupFixturesBySuite(fixtures: ExpandedFixture[]): Map<string, ExpandedFixture[]> {
  const suites = new Map<string, ExpandedFixture[]>();

  for (const fixture of fixtures) {
    // Extract suite name from path (e.g., fixtures/entities/basic-entity -> entities)
    const parts = fixture.fixtureDir.split(path.sep);
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
  concurrency?: number;
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
    concurrency = 5,
  } = options;

  // Initialize check registry
  await initializeChecks();

  // Discover fixture directories
  let fixtureDirs = await discoverFixtures(fixturesDir);

  // Filter directories by specific fixture names if provided
  if (fixtureNames && fixtureNames.length > 0) {
    fixtureDirs = fixtureDirs.filter(f => {
      const fixtureName = path.basename(f);
      return fixtureNames.some(name =>
        fixtureName === name || fixtureName.includes(name)
      );
    });
  }

  // Apply filter pattern to directories
  if (filter) {
    const filterLower = filter.toLowerCase();
    fixtureDirs = fixtureDirs.filter(f => f.toLowerCase().includes(filterLower));
  }

  // Expand multi-prompt fixtures into individual entries
  let expanded = await expandFixtures(fixtureDirs);

  // Apply filter to expanded fixture names too
  if (filter) {
    const filterLower = filter.toLowerCase();
    expanded = expanded.filter(f => f.name.toLowerCase().includes(filterLower));
  }

  if (verbose) {
    console.log(`Found ${fixtureDirs.length} fixture directories, ${expanded.length} prompts`);
  }

  // Group by suite
  const suiteMap = groupFixturesBySuite(expanded);

  // Flatten all fixtures with their suite name for parallel execution
  const allItems: { suiteName: string; fixture: ExpandedFixture }[] = [];
  for (const [suiteName, suiteFixtures] of suiteMap) {
    for (const fixture of suiteFixtures) {
      allItems.push({ suiteName, fixture });
    }
  }

  if (verbose) {
    console.log(`Running ${allItems.length} fixtures with concurrency ${concurrency}`);
  }

  // Run all fixtures in parallel with concurrency limit
  const allResults = await runPool(allItems, concurrency, async ({ fixture }) => {
    const result = await runFixture(agent, fixture, verbose);

    // Print pass/fail as each fixture completes
    if (result.passed) {
      console.log(`  ✅ ${result.name}`);
    } else {
      console.log(`  ❌ ${result.name}`);
      if (verbose && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }

    return result;
  });

  // Re-group results by suite
  let totalPassed = 0;
  let totalFailed = 0;
  const suiteResults = new Map<string, FixtureResult[]>();

  for (let i = 0; i < allItems.length; i++) {
    const { suiteName } = allItems[i];
    const result = allResults[i];

    if (!suiteResults.has(suiteName)) {
      suiteResults.set(suiteName, []);
    }
    suiteResults.get(suiteName)!.push(result);

    if (result.passed) {
      totalPassed++;
    } else {
      totalFailed++;
    }
  }

  const suites: SuiteResult[] = [];
  for (const [suiteName] of suiteMap) {
    const fixtureResults = suiteResults.get(suiteName) || [];
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
