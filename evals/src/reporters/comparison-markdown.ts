import fs from 'fs/promises';
import path from 'path';
import type { ComparisonResult, ExperimentRunResult, FixtureResult } from '../types.js';

function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function formatDateForFilename(date: Date): string {
  return date.toISOString()
    .replace('T', '-')
    .replace(/:/g, '')
    .substring(0, 17);
}

function escapeMarkdown(text: string): string {
  return text.replace(/[|]/g, '\\|');
}

function generateSummaryTable(result: ComparisonResult): string {
  const lines: string[] = [];

  lines.push('## Summary');
  lines.push('| Experiment | Passed | Failed | Pass Rate |');
  lines.push('|------------|--------|--------|-----------|');

  // Sort by pass rate descending
  const sortedExperiments = Object.entries(result.summary.byExperiment)
    .sort((a, b) => {
      const rateA = a[1].total > 0 ? a[1].passed / a[1].total : 0;
      const rateB = b[1].total > 0 ? b[1].passed / b[1].total : 0;
      return rateB - rateA;
    });

  for (const [expName, stats] of sortedExperiments) {
    const passRate = stats.total > 0
      ? Math.round((stats.passed / stats.total) * 100)
      : 0;
    const isBest = expName === result.summary.bestExperiment;
    const name = isBest ? `**${expName}**` : expName;
    lines.push(`| ${name} | ${stats.passed} | ${stats.failed} | ${passRate}% |`);
  }

  lines.push('');
  return lines.join('\n');
}

function generateComparisonMatrix(result: ComparisonResult): string {
  const lines: string[] = [];

  lines.push('## Comparison Matrix');

  // Header row
  const headerCells = ['Fixture', ...result.experiments];
  lines.push(`| ${headerCells.join(' | ')} |`);
  lines.push(`|${headerCells.map(() => '---').join('|')}|`);

  // Fixture rows
  for (const fixture of result.fixtures) {
    const cells = [fixture];
    for (const exp of result.experiments) {
      const passed = result.matrix[exp]?.[fixture];
      cells.push(passed === undefined ? '-' : passed ? '✅' : '❌');
    }
    lines.push(`| ${cells.join(' | ')} |`);
  }

  lines.push('');
  return lines.join('\n');
}

function generateInconsistentResults(result: ComparisonResult): string {
  const lines: string[] = [];

  // Find fixtures with inconsistent results (some passed, some failed)
  const inconsistent: Array<{
    fixture: string;
    passed: string[];
    failed: string[];
  }> = [];

  for (const [fixtureName, stats] of Object.entries(result.summary.byFixture)) {
    if (stats.passedExperiments.length > 0 && stats.failedExperiments.length > 0) {
      inconsistent.push({
        fixture: fixtureName,
        passed: stats.passedExperiments,
        failed: stats.failedExperiments,
      });
    }
  }

  if (inconsistent.length === 0) {
    return '';
  }

  lines.push('## Inconsistent Results');
  lines.push('');

  for (const item of inconsistent) {
    lines.push(`- **${item.fixture}**: Passed in ${item.passed.join(', ')}, Failed in ${item.failed.join(', ')}`);
  }

  lines.push('');
  return lines.join('\n');
}

function generateExperimentDetails(expResult: ExperimentRunResult): string {
  const lines: string[] = [];
  const total = expResult.totalPassed + expResult.totalFailed;

  lines.push(`<details>`);
  lines.push(`<summary>${expResult.experiment} (${expResult.totalPassed}/${total})</summary>`);
  lines.push('');

  for (const suite of expResult.suites) {
    lines.push(`### ${suite.name}`);
    lines.push('');

    for (const fixture of suite.fixtures) {
      const status = fixture.passed ? '✅' : '❌';
      lines.push(`- ${status} **${fixture.name}**: ${escapeMarkdown(fixture.description)}`);

      // Show failed checks
      if (!fixture.passed) {
        const failedChecks = fixture.checks.filter(c => !c.passed);
        for (const check of failedChecks) {
          lines.push(`  - ❌ ${escapeMarkdown(check.name)}: ${escapeMarkdown(check.details ?? '')}`);
        }
        if (fixture.error) {
          lines.push(`  - Error: ${escapeMarkdown(fixture.error)}`);
        }
        if (!fixture.skillCheckPassed) {
          lines.push(`  - Skills: expected ${fixture.expectedSkills.join(', ')}, got ${fixture.skillsInvoked.join(', ') || '(none)'}`);
        }
      }
    }

    lines.push('');
  }

  lines.push('</details>');
  lines.push('');

  return lines.join('\n');
}

export function generateComparisonReport(result: ComparisonResult): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Experiment Comparison: ${result.name}`);
  lines.push(`**Date**: ${formatDate(result.date)}`);
  lines.push(`**Agent**: ${result.agent}`);
  lines.push(`**Experiments**: ${result.experiments.length} | **Fixtures**: ${result.fixtures.length}`);
  lines.push('');

  // Summary table
  lines.push(generateSummaryTable(result));

  // Comparison matrix
  lines.push(generateComparisonMatrix(result));

  // Inconsistent results
  const inconsistent = generateInconsistentResults(result);
  if (inconsistent) {
    lines.push(inconsistent);
  }

  // Detailed results per experiment
  lines.push('## Detailed Results');
  lines.push('');

  for (const expResult of result.experimentResults) {
    lines.push(generateExperimentDetails(expResult));
  }

  return lines.join('\n');
}

export async function writeComparisonReport(
  result: ComparisonResult,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });

  const report = generateComparisonReport(result);
  const filename = `comparison-${formatDateForFilename(result.date)}-${result.name}.md`;
  const filepath = path.join(outputDir, filename);

  await fs.writeFile(filepath, report, 'utf-8');

  // Update latest comparison symlink
  const latestPath = path.join(outputDir, 'latest-comparison.md');
  try {
    await fs.unlink(latestPath);
  } catch {
    // Ignore if doesn't exist
  }
  await fs.symlink(filename, latestPath);

  return filepath;
}
