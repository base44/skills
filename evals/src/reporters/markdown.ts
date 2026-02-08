import fs from 'fs/promises';
import path from 'path';
import type { EvalRunResult, FixtureResult, SuiteResult } from '../types.js';

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

function generateFixtureSection(fixture: FixtureResult): string {
  const status = fixture.passed ? '✅' : '❌';
  const lines: string[] = [];

  lines.push(`### ${status} ${fixture.name}`);
  lines.push(`**Fixture**: \`${fixture.fixtureDir}\``);
  lines.push(`**Prompt**: ${escapeMarkdown(fixture.prompt)}`);
  lines.push('');

  // Skills section
  const skillStatus = fixture.skillCheckPassed ? '✓' : '✗';
  if (fixture.expectedSkills.length > 0) {
    lines.push(`- **Expected Skills**: ${fixture.expectedSkills.join(', ')} ${skillStatus}`);
  }
  if (fixture.skillsInvoked.length > 0) {
    lines.push(`- **Skills Invoked**: ${fixture.skillsInvoked.join(', ')}`);
  } else {
    lines.push('- **Skills Invoked**: (none detected)');
  }
  lines.push('');

  // Checks table
  if (fixture.checks.length > 0) {
    lines.push('- **Checks**:');
    lines.push('  | Check | Status | Details |');
    lines.push('  |-------|--------|---------|');
    for (const check of fixture.checks) {
      const checkStatus = check.passed ? '✅' : '❌';
      const details = escapeMarkdown(check.details ?? '');
      lines.push(`  | ${escapeMarkdown(check.name)} | ${checkStatus} | ${details} |`);
    }
    lines.push('');
  }

  // Error if present
  if (fixture.error) {
    lines.push(`> **Error**: ${escapeMarkdown(fixture.error)}`);
    lines.push('');
  }

  // Agent output in details
  lines.push('<details>');
  lines.push('<summary>Agent Output</summary>');
  lines.push('');
  lines.push('```');
  lines.push(fixture.agentOutput.substring(0, 5000)); // Truncate long outputs
  if (fixture.agentOutput.length > 5000) {
    lines.push('... (truncated)');
  }
  lines.push('```');
  lines.push('</details>');
  lines.push('');

  return lines.join('\n');
}

function generateSuiteSection(suite: SuiteResult): string {
  const lines: string[] = [];

  lines.push(`## ${suite.name} Suite`);
  lines.push('');

  for (const fixture of suite.fixtures) {
    lines.push(generateFixtureSection(fixture));
  }

  return lines.join('\n');
}

export function generateMarkdownReport(result: EvalRunResult): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Eval Run: ${result.name}`);
  lines.push(`**Date**: ${formatDate(result.date)}`);
  lines.push(`**Agent**: ${result.agent}`);

  const totalFixtures = result.totalPassed + result.totalFailed;
  lines.push(`**Fixtures**: ${totalFixtures}`);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('| Status | Count |');
  lines.push('|--------|-------|');
  lines.push(`| ✅ Passed | ${result.totalPassed} |`);
  lines.push(`| ❌ Failed | ${result.totalFailed} |`);
  lines.push('');

  // Suite sections
  for (const suite of result.suites) {
    lines.push(generateSuiteSection(suite));
  }

  return lines.join('\n');
}

export async function writeReport(
  result: EvalRunResult,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });

  const report = generateMarkdownReport(result);
  const filename = `run-${formatDateForFilename(result.date)}-${result.name}.md`;
  const filepath = path.join(outputDir, filename);

  await fs.writeFile(filepath, report, 'utf-8');

  // Update latest symlink
  const latestPath = path.join(outputDir, 'latest.md');
  try {
    await fs.unlink(latestPath);
  } catch {
    // Ignore if doesn't exist
  }
  await fs.symlink(filename, latestPath);

  return filepath;
}
