#!/usr/bin/env node

import path from 'path';
import { createAgent } from './agents/interface.js';
import { runEvals } from './runner.js';
import { writeReport } from './reporters/markdown.js';

interface CliOptions {
  name: string;
  agent: string;
  fixturesDir: string;
  outputDir: string;
  verbose: boolean;
  filter?: string;
  fixtures?: string[];
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    name: 'default',
    agent: 'claude-code',
    fixturesDir: 'fixtures',
    outputDir: 'results',
    verbose: false,
  };

  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
      continue;
    }

    switch (arg) {
      case '--name':
      case '-n':
        options.name = args[++i] ?? 'default';
        break;
      case '--agent':
      case '-a':
        options.agent = args[++i] ?? 'claude-code';
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
      case '--filter':
        options.filter = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  if (positionalArgs.length > 0) {
    options.fixtures = positionalArgs;
  }

  return options;
}

function printHelp(): void {
  console.log(`
Skills Eval Runner

Usage: npm run eval -- [options] [fixture-names...]

Arguments:
  fixture-names           Specific fixtures to run (by name)

Options:
  -n, --name <name>       Name for this eval run (default: "default")
  -a, --agent <agent>     Agent to use (default: "claude-code")
  -f, --fixtures <dir>    Fixtures directory (default: "fixtures")
  -o, --output <dir>      Output directory for reports (default: "results")
  -v, --verbose           Verbose output
  --filter <pattern>      Filter fixtures by name pattern
  -h, --help              Show this help

Examples:
  npm run eval
  npm run eval -- --name "baseline"
  npm run eval -- --name "sonnet-test" --verbose
  npm run eval -- --filter entities
  npm run eval -- skill-check nextjs-todo
  npm run eval -- agent-chat-component --verbose
`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Starting eval run: ${options.name}`);
  console.log(`Agent: ${options.agent}`);
  console.log(`Fixtures: ${options.fixturesDir}`);
  if (options.fixtures) {
    console.log(`Running specific fixtures: ${options.fixtures.join(', ')}`);
  }
  console.log('');

  const agent = createAgent(options.agent);

  const result = await runEvals(agent, {
    name: options.name,
    fixturesDir: options.fixturesDir,
    verbose: options.verbose,
    filter: options.filter,
    fixtures: options.fixtures,
  });

  // Write report
  const reportPath = await writeReport(result, options.outputDir);

  // Print summary
  console.log('');
  console.log('='.repeat(50));
  console.log('Eval Run Complete');
  console.log('='.repeat(50));
  console.log(`Passed: ${result.totalPassed}`);
  console.log(`Failed: ${result.totalFailed}`);
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);

  // Exit with error code if any tests failed
  if (result.totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
