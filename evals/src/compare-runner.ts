import path from 'path';
import { fileURLToPath } from 'url';
import type {
  CodingAgent,
  ComparisonResult,
  ExperimentRunResult,
  FixtureResult,
} from './types.js';
import { discoverExperiments, filterExperiments } from './experiments.js';
import { setupFixtures } from './setup.js';
import { runEvals, discoverFixtures } from './runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

export interface CompareOptions {
  name?: string;
  experimentsDir?: string;
  fixturesDir?: string;
  verbose?: boolean;
  filterFixtures?: string;
  filterExperiments?: string;
}

/**
 * Run comparison across multiple experiments.
 */
export async function runComparison(
  agent: CodingAgent,
  options: CompareOptions = {}
): Promise<ComparisonResult> {
  const {
    name = 'comparison',
    experimentsDir = path.join(rootDir, 'experiments'),
    fixturesDir = path.join(rootDir, 'fixtures'),
    verbose = false,
    filterFixtures,
    filterExperiments: experimentFilter,
  } = options;

  // Discover experiments
  let experiments = await discoverExperiments(experimentsDir);

  if (experiments.length === 0) {
    throw new Error(`No experiments found in ${experimentsDir}`);
  }

  // Apply experiment filter
  if (experimentFilter) {
    experiments = filterExperiments(experiments, experimentFilter);
    if (experiments.length === 0) {
      throw new Error(`No experiments match filter: ${experimentFilter}`);
    }
  }

  if (verbose) {
    console.log(`Found ${experiments.length} experiments: ${experiments.map(e => e.name).join(', ')}`);
  }

  // Discover fixtures to get list of fixture names
  let fixturesList = await discoverFixtures(fixturesDir);
  if (filterFixtures) {
    const filterLower = filterFixtures.toLowerCase();
    fixturesList = fixturesList.filter(f => f.toLowerCase().includes(filterLower));
  }

  // Extract fixture names from paths
  const fixtureNames = fixturesList.map(f => {
    const parts = f.split(path.sep);
    return parts[parts.length - 1];
  });

  if (verbose) {
    console.log(`Found ${fixtureNames.length} fixtures`);
  }

  // Initialize result structures
  const experimentResults: ExperimentRunResult[] = [];
  const matrix: Record<string, Record<string, boolean>> = {};

  // Run each experiment
  for (const experiment of experiments) {
    if (verbose) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Running experiment: ${experiment.name}`);
      console.log(`Skills: ${experiment.skills.join(', ')}`);
      console.log('='.repeat(50));
    }

    // Setup fixtures with this experiment's CLAUDE.md (if any)
    await setupFixtures({
      fixturesDir,
      experimentDir: experiment.skillsDir,
      verbose,
    });

    // Run evals
    const evalResult = await runEvals(agent, {
      name: experiment.name,
      fixturesDir,
      verbose,
      filter: filterFixtures,
    });

    // Convert to ExperimentRunResult
    const expResult: ExperimentRunResult = {
      experiment: experiment.name,
      date: evalResult.date,
      agent: evalResult.agent,
      suites: evalResult.suites,
      totalPassed: evalResult.totalPassed,
      totalFailed: evalResult.totalFailed,
    };
    experimentResults.push(expResult);

    // Build matrix entry for this experiment
    matrix[experiment.name] = {};
    for (const suite of evalResult.suites) {
      for (const fixture of suite.fixtures) {
        matrix[experiment.name][fixture.name] = fixture.passed;
      }
    }

    if (verbose) {
      console.log(`\nExperiment ${experiment.name}: ${evalResult.totalPassed} passed, ${evalResult.totalFailed} failed`);
    }
  }

  // Build summary
  const summary = buildSummary(experimentResults, matrix);

  // Get all unique fixture names from results
  const allFixtureNames = new Set<string>();
  for (const exp of experimentResults) {
    for (const suite of exp.suites) {
      for (const fixture of suite.fixtures) {
        allFixtureNames.add(fixture.name);
      }
    }
  }

  return {
    name,
    date: new Date(),
    agent: agent.name,
    experiments: experiments.map(e => e.name),
    fixtures: Array.from(allFixtureNames).sort(),
    matrix,
    experimentResults,
    summary,
  };
}

function buildSummary(
  experimentResults: ExperimentRunResult[],
  matrix: Record<string, Record<string, boolean>>
): ComparisonResult['summary'] {
  const byExperiment: Record<string, { passed: number; failed: number; total: number }> = {};
  const byFixture: Record<string, { passedExperiments: string[]; failedExperiments: string[] }> = {};

  // Calculate per-experiment stats
  for (const result of experimentResults) {
    byExperiment[result.experiment] = {
      passed: result.totalPassed,
      failed: result.totalFailed,
      total: result.totalPassed + result.totalFailed,
    };
  }

  // Calculate per-fixture stats
  for (const [expName, fixtures] of Object.entries(matrix)) {
    for (const [fixtureName, passed] of Object.entries(fixtures)) {
      if (!byFixture[fixtureName]) {
        byFixture[fixtureName] = { passedExperiments: [], failedExperiments: [] };
      }
      if (passed) {
        byFixture[fixtureName].passedExperiments.push(expName);
      } else {
        byFixture[fixtureName].failedExperiments.push(expName);
      }
    }
  }

  // Find best experiment
  let bestExperiment = '';
  let bestPassRate = -1;
  for (const [expName, stats] of Object.entries(byExperiment)) {
    const passRate = stats.total > 0 ? stats.passed / stats.total : 0;
    if (passRate > bestPassRate) {
      bestPassRate = passRate;
      bestExperiment = expName;
    }
  }

  return {
    byExperiment,
    byFixture,
    bestExperiment,
  };
}
