#!/usr/bin/env node

import path from 'path';
import { createAgent } from './agents/interface.js';
import { runComparison } from './compare-runner.js';
import { writeComparisonReport } from './reporters/comparison-markdown.js';
import type { ComparisonResult } from './types.js';

interface CliOptions {
  name: string;
  agent: string;
  experimentsDir: string;
  fixturesDir: string;
  outputDir: string;
  verbose: boolean;
  runs: number;
  concurrency: number;
  filterFixtures?: string;
  filterExperiments?: string;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    name: 'comparison',
    agent: 'claude-code',
    experimentsDir: 'experiments',
    fixturesDir: 'fixtures',
    outputDir: 'results',
    verbose: false,
    runs: 1,
    concurrency: 5,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--name':
      case '-n':
        options.name = args[++i] ?? 'comparison';
        break;
      case '--agent':
      case '-a':
        options.agent = args[++i] ?? 'claude-code';
        break;
      case '--experiments':
      case '-e':
        options.experimentsDir = args[++i] ?? 'experiments';
        break;
      case '--fixtures':
      case '-f':
        options.fixturesDir = args[++i] ?? 'fixtures';
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i] ?? 'results';
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--runs':
      case '-r':
        options.runs = parseInt(args[++i] ?? '1', 10);
        break;
      case '--concurrency':
      case '-c':
        options.concurrency = parseInt(args[++i] ?? '5', 10);
        break;
      case '--filter-fixtures':
        options.filterFixtures = args[++i];
        break;
      case '--filter-experiments':
        options.filterExperiments = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Experiment Comparison Runner

Usage: npm run eval:compare -- [options]

Options:
  -n, --name <name>                 Name for this comparison run (default: "comparison")
  -r, --runs <count>                Number of times to run (default: 1)
  -a, --agent <agent>               Agent to use (default: "claude-code")
  -e, --experiments <dir>           Experiments directory (default: "experiments")
  -f, --fixtures <dir>              Fixtures directory (default: "fixtures")
  -o, --output <dir>                Output directory for reports (default: "results")
  -c, --concurrency <n>             Max concurrent fixtures (default: 5)
  -v, --verbose                     Verbose output
  --filter-fixtures <pattern>       Filter fixtures by name pattern
  --filter-experiments <pattern>    Filter experiments by name pattern
  -h, --help                        Show this help

Examples:
  npm run eval:compare
  npm run eval:compare -- --runs 3                    # Run 3 times to check consistency
  npm run eval:compare -- --name "skills-test" --verbose
  npm run eval:compare -- --filter-experiments baseline
  npm run eval:compare -- --filter-fixtures entities
`);
}

interface RunResult {
  runNumber: number;
  result: ComparisonResult;
  reportPath: string;
}

interface AggregatedStats {
  experiment: string;
  runs: number;
  totalPassed: number;
  totalFailed: number;
  perfectRuns: number;  // Runs with 100% pass rate
  passRates: number[];  // Pass rate per run
  avgPassRate: number;
  consistency: string;  // "3/3" format
}

function aggregateResults(runResults: RunResult[]): Map<string, AggregatedStats> {
  const stats = new Map<string, AggregatedStats>();

  for (const { runNumber, result } of runResults) {
    for (const [expName, expStats] of Object.entries(result.summary.byExperiment)) {
      if (!stats.has(expName)) {
        stats.set(expName, {
          experiment: expName,
          runs: 0,
          totalPassed: 0,
          totalFailed: 0,
          perfectRuns: 0,
          passRates: [],
          avgPassRate: 0,
          consistency: '',
        });
      }

      const s = stats.get(expName)!;
      s.runs++;
      s.totalPassed += expStats.passed;
      s.totalFailed += expStats.failed;

      const passRate = expStats.total > 0 ? (expStats.passed / expStats.total) * 100 : 0;
      s.passRates.push(passRate);

      if (expStats.failed === 0) {
        s.perfectRuns++;
      }
    }
  }

  // Calculate averages and consistency
  for (const s of stats.values()) {
    s.avgPassRate = s.passRates.reduce((a, b) => a + b, 0) / s.passRates.length;
    s.consistency = `${s.perfectRuns}/${s.runs}`;
  }

  return stats;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Starting comparison: ${options.name}`);
  console.log(`Agent: ${options.agent}`);
  console.log(`Runs: ${options.runs}`);
  console.log(`Experiments: ${options.experimentsDir}`);
  console.log(`Fixtures: ${options.fixturesDir}`);
  console.log('');

  const agent = createAgent(options.agent);
  const runResults: RunResult[] = [];

  for (let run = 1; run <= options.runs; run++) {
    if (options.runs > 1) {
      console.log('');
      console.log('#'.repeat(50));
      console.log(`# Run ${run}/${options.runs}`);
      console.log('#'.repeat(50));
    }

    const result = await runComparison(agent, {
      name: `${options.name}-run${run}`,
      experimentsDir: options.experimentsDir,
      fixturesDir: options.fixturesDir,
      verbose: options.verbose,
      filterFixtures: options.filterFixtures,
      filterExperiments: options.filterExperiments,
      concurrency: options.concurrency,
    });

    const reportPath = await writeComparisonReport(result, options.outputDir);
    runResults.push({ runNumber: run, result, reportPath });

    // Print run summary
    console.log('');
    console.log(`Run ${run} Results:`);
    for (const [expName, stats] of Object.entries(result.summary.byExperiment)) {
      const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      const status = stats.failed === 0 ? '✅' : '❌';
      console.log(`  ${status} ${expName}: ${stats.passed}/${stats.total} (${passRate}%)`);
    }
  }

  // Print aggregated summary for multiple runs
  if (options.runs > 1) {
    const aggregated = aggregateResults(runResults);

    console.log('');
    console.log('='.repeat(60));
    console.log(`AGGREGATED RESULTS (${options.runs} runs)`);
    console.log('='.repeat(60));
    console.log('');
    console.log('| Experiment | Avg Pass Rate | Consistency | Perfect Runs |');
    console.log('|------------|---------------|-------------|--------------|');

    // Sort by consistency (perfect runs) then by avg pass rate
    const sorted = Array.from(aggregated.values()).sort((a, b) => {
      if (b.perfectRuns !== a.perfectRuns) return b.perfectRuns - a.perfectRuns;
      return b.avgPassRate - a.avgPassRate;
    });

    for (const s of sorted) {
      const avgStr = `${Math.round(s.avgPassRate)}%`;
      const marker = s.perfectRuns === s.runs ? ' ⭐' : '';
      console.log(`| ${s.experiment.padEnd(10)} | ${avgStr.padEnd(13)} | ${s.consistency.padEnd(11)} | ${s.perfectRuns}/${s.runs}${marker.padEnd(10)} |`);
    }

    console.log('');
    console.log('Legend: ⭐ = 100% consistency (all runs passed)');
    console.log('');
    console.log('Reports:');
    for (const { runNumber, reportPath } of runResults) {
      console.log(`  Run ${runNumber}: ${path.relative(process.cwd(), reportPath)}`);
    }
  } else {
    // Single run summary
    const result = runResults[0].result;
    console.log('');
    console.log('='.repeat(50));
    console.log('Comparison Complete');
    console.log('='.repeat(50));
    console.log(`Experiments: ${result.experiments.length}`);
    console.log(`Fixtures: ${result.fixtures.length}`);
    console.log(`Best: ${result.summary.bestExperiment}`);
    console.log('');
    console.log(`Report: ${path.relative(process.cwd(), runResults[0].reportPath)}`);
  }

  // Exit with error code if any run had failures in best experiment
  const lastResult = runResults[runResults.length - 1].result;
  const bestStats = lastResult.summary.byExperiment[lastResult.summary.bestExperiment];
  if (bestStats && bestStats.failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
