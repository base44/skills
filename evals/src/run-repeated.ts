#!/usr/bin/env node

/**
 * Run evals N times and produce a consolidated report.
 * Usage: npx tsx src/run-repeated.ts [--runs N] [--verbose] [--filter pattern] [fixture-names...]
 */

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createAgent } from './agents/interface.js';
import { runEvals } from './runner.js';
import type { EvalRunResult, FixtureResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

interface Options {
  runs: number;
  verbose: boolean;
  concurrency: number;
  filter?: string;
  fixtures?: string[];
}

function parseArgs(args: string[]): Options {
  const options: Options = { runs: 3, verbose: false, concurrency: 5 };
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--runs' || arg === '-r') {
      options.runs = parseInt(args[++i] ?? '3', 10);
    } else if (arg === '--concurrency' || arg === '-c') {
      options.concurrency = parseInt(args[++i] ?? '5', 10);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--filter') {
      options.filter = args[++i];
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    options.fixtures = positional;
  }
  return options;
}

interface PromptStats {
  name: string;
  description: string;
  runs: number;
  passed: number;
  failed: number;
  passRate: number;
  checkResults: Map<string, { passed: number; total: number }>;
  skillCheckResults: { passed: number; total: number };
  errors: string[];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const fixturesDir = path.join(rootDir, 'fixtures');
  const agent = createAgent('claude-code');

  console.log(`=== Repeated Eval Run ===`);
  console.log(`Runs per prompt: ${options.runs}`);
  console.log(`Agent: claude-code`);
  console.log('');

  // Collect results across all runs
  const allResults: EvalRunResult[] = [];

  for (let run = 1; run <= options.runs; run++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`RUN ${run} of ${options.runs}`);
    console.log('='.repeat(60));

    const result = await runEvals(agent, {
      name: `run-${run}`,
      fixturesDir,
      verbose: options.verbose,
      filter: options.filter,
      fixtures: options.fixtures,
      concurrency: options.concurrency,
    });

    allResults.push(result);

    console.log(`Run ${run}: ${result.totalPassed} passed, ${result.totalFailed} failed`);
  }

  // Aggregate results per prompt
  const promptStats = new Map<string, PromptStats>();

  for (const result of allResults) {
    for (const suite of result.suites) {
      for (const fixture of suite.fixtures) {
        let stats = promptStats.get(fixture.name);
        if (!stats) {
          stats = {
            name: fixture.name,
            description: fixture.description,
            runs: 0,
            passed: 0,
            failed: 0,
            passRate: 0,
            checkResults: new Map(),
            skillCheckResults: { passed: 0, total: 0 },
            errors: [],
          };
          promptStats.set(fixture.name, stats);
        }

        stats.runs++;
        if (fixture.passed) {
          stats.passed++;
        } else {
          stats.failed++;
        }

        // Track skill check
        stats.skillCheckResults.total++;
        if (fixture.skillCheckPassed) {
          stats.skillCheckResults.passed++;
        }

        // Track individual checks
        for (const check of fixture.checks) {
          let checkStat = stats.checkResults.get(check.name);
          if (!checkStat) {
            checkStat = { passed: 0, total: 0 };
            stats.checkResults.set(check.name, checkStat);
          }
          checkStat.total++;
          if (check.passed) {
            checkStat.passed++;
          }
        }

        // Track errors
        if (fixture.error) {
          stats.errors.push(fixture.error);
        }
      }
    }
  }

  // Calculate pass rates
  for (const stats of promptStats.values()) {
    stats.passRate = stats.runs > 0 ? stats.passed / stats.runs : 0;
  }

  // Generate report
  const report = generateReport(options.runs, promptStats, allResults);

  // Write report
  const outputDir = path.join(rootDir, 'results');
  await fs.mkdir(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace('T', '-').replace(/:/g, '').substring(0, 17);
  const reportPath = path.join(outputDir, `repeated-${timestamp}-${options.runs}runs.md`);
  await fs.writeFile(reportPath, report, 'utf-8');

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(60));

  const sorted = Array.from(promptStats.values()).sort((a, b) => a.name.localeCompare(b.name));
  const totalPrompts = sorted.length;
  const perfect = sorted.filter(s => s.passRate === 1).length;
  const flaky = sorted.filter(s => s.passRate > 0 && s.passRate < 1).length;
  const alwaysFail = sorted.filter(s => s.passRate === 0).length;

  console.log(`Total prompts: ${totalPrompts}`);
  console.log(`Always pass (${options.runs}/${options.runs}): ${perfect}`);
  console.log(`Flaky (some pass): ${flaky}`);
  console.log(`Always fail (0/${options.runs}): ${alwaysFail}`);
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);
}

function generateReport(
  numRuns: number,
  promptStats: Map<string, PromptStats>,
  allResults: EvalRunResult[]
): string {
  const lines: string[] = [];
  const sorted = Array.from(promptStats.values()).sort((a, b) => a.name.localeCompare(b.name));

  lines.push(`# Eval Report: ${numRuns} Runs Per Prompt`);
  lines.push(`**Date**: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`);
  lines.push(`**Agent**: claude-code`);
  lines.push(`**Runs per prompt**: ${numRuns}`);
  lines.push(`**Total prompts**: ${sorted.length}`);
  lines.push('');

  // Overall summary
  const perfect = sorted.filter(s => s.passRate === 1);
  const flaky = sorted.filter(s => s.passRate > 0 && s.passRate < 1);
  const alwaysFail = sorted.filter(s => s.passRate === 0);

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Category | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Always pass (${numRuns}/${numRuns}) | ${perfect.length} |`);
  lines.push(`| Flaky (some pass) | ${flaky.length} |`);
  lines.push(`| Always fail (0/${numRuns}) | ${alwaysFail.length} |`);
  lines.push(`| **Total** | **${sorted.length}** |`);
  lines.push('');

  // Pass rate table
  lines.push('## Pass Rates');
  lines.push('');
  lines.push('| Prompt | Pass Rate | Passed | Failed | Skill Check |');
  lines.push('|--------|-----------|--------|--------|-------------|');

  for (const stats of sorted) {
    const pct = `${Math.round(stats.passRate * 100)}%`;
    const bar = stats.passRate === 1 ? '🟢' : stats.passRate === 0 ? '🔴' : '🟡';
    const skillPct = stats.skillCheckResults.total > 0
      ? `${stats.skillCheckResults.passed}/${stats.skillCheckResults.total}`
      : '-';
    lines.push(`| ${bar} ${stats.name} | ${pct} | ${stats.passed}/${stats.runs} | ${stats.failed}/${stats.runs} | ${skillPct} |`);
  }
  lines.push('');

  // Group by category
  const categories = new Map<string, PromptStats[]>();
  for (const stats of sorted) {
    const cat = stats.name.replace(/-[^-]+$/, '').replace(/^(sdk|cli|fullstack|anti-hallucination)-?/, (_, prefix) => prefix);
    // Better: group by fixture directory prefix
    const prefix = stats.name.split('-').slice(0, 2).join('-');
    if (!categories.has(prefix)) {
      categories.set(prefix, []);
    }
    categories.get(prefix)!.push(stats);
  }

  // Detailed check breakdown for non-perfect prompts
  const imperfect = sorted.filter(s => s.passRate < 1);
  if (imperfect.length > 0) {
    lines.push('## Check-Level Details (Non-Perfect Prompts)');
    lines.push('');

    for (const stats of imperfect) {
      lines.push(`### ${stats.name} (${stats.passed}/${stats.runs} passed)`);
      lines.push('');

      if (stats.checkResults.size > 0) {
        lines.push('| Check | Pass Rate |');
        lines.push('|-------|-----------|');
        for (const [checkName, checkStat] of stats.checkResults) {
          const checkPct = checkStat.total > 0 ? `${checkStat.passed}/${checkStat.total}` : '-';
          const checkBar = checkStat.passed === checkStat.total ? '✅' : '❌';
          lines.push(`| ${checkBar} ${checkName} | ${checkPct} |`);
        }
        lines.push('');
      }

      if (stats.errors.length > 0) {
        lines.push('**Errors:**');
        for (const err of stats.errors) {
          lines.push(`- ${err.substring(0, 200)}`);
        }
        lines.push('');
      }
    }
  }

  // Per-run results
  lines.push('## Per-Run Results');
  lines.push('');
  for (let i = 0; i < allResults.length; i++) {
    const r = allResults[i];
    lines.push(`- **Run ${i + 1}**: ${r.totalPassed} passed, ${r.totalFailed} failed`);
  }
  lines.push('');

  return lines.join('\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
