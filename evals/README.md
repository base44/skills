# Skills Eval System

An evaluation system for testing skill activation and result correctness against Claude Code (or other coding agents).

## Quick Start

```bash
# Install dependencies
npm install

# Run all evals (automatically syncs skills from parent directory)
npm run eval

# Run with a named run
npm run eval -- --name "baseline"

# Filter to specific fixtures
npm run eval -- --filter nextjs --verbose

# Run without re-syncing skills (faster for repeated runs)
npm run eval:only -- --name "quick-test"
```

### Setup

The `npm run eval` command automatically runs `npm run setup` first, which copies skills from the parent `../skills/` directory into each fixture. This ensures fixtures always test against the latest skill versions.

To manually sync skills:
```bash
npm run setup
```

## Directory Structure

```
evals/
├── src/                      # Source code
│   ├── index.ts              # CLI entry point
│   ├── runner.ts             # Eval runner orchestration
│   ├── agents/               # Coding agent implementations
│   │   ├── interface.ts      # CodingAgent interface
│   │   └── claude-code.ts    # Claude Code CLI implementation
│   ├── checks/               # Check implementations
│   │   ├── interface.ts      # Check registry
│   │   ├── entity-config.ts  # Entity schema validation
│   │   ├── function-def.ts   # Function definition validation
│   │   ├── agent-config.ts   # Agent config validation
│   │   ├── contains.ts       # String containment check
│   │   ├── file-exists.ts    # File existence check
│   │   ├── file-content.ts   # File content pattern matching
│   │   ├── command-passes.ts # Command execution check
│   │   ├── valid-json.ts     # JSON validity check
│   │   └── json-schema.ts    # Generic JSON schema validation
│   ├── reporters/
│   │   └── markdown.ts       # Markdown report generator
│   └── types.ts              # Shared types
├── fixtures/                 # Test fixtures (realistic projects)
│   ├── nextjs-todo/          # Next.js app - add todo entities
│   ├── react-task-manager/   # React app - implement SDK usage
│   └── existing-app-add-feature/  # Add backend function
├── results/                  # Generated reports
├── eval.schema.json          # JSON Schema for eval.json files
├── package.json
└── tsconfig.json
```

## Fixtures

Each fixture is a **complete, isolated project** that the agent runs against:

```
fixture-name/
├── eval.json           # Eval config: prompt, expected outcomes, checks
├── AGENTS.md           # Project context for the agent
└── project/            # The actual project directory (cwd for agent)
    ├── .claude/
    │   └── settings.json   # Claude settings (skills paths)
    ├── skills/             # Skills (copied by setup script)
    │   ├── base44-cli/
    │   └── base44-sdk/
    ├── base44/
    │   ├── config.jsonc
    │   └── entities/
    ├── src/
    ├── package.json
    └── ...
```

**Important:** Skills are copied into `project/skills/` by the setup script. The `.claude/settings.json` file inside `project/` references these skills.

### Current Fixtures

| Fixture | Description | Tests |
|---------|-------------|-------|
| `nextjs-todo` | Next.js app needing todo entities | Entity creation, file structure, CLI commands |
| `react-task-manager` | React app with existing Task entity | SDK usage, API calls, React hooks |
| `existing-app-add-feature` | App needing a backend function | Function creation, Deno patterns, integrations |

## Creating a New Test

1. **Create a fixture directory**:
   ```bash
   mkdir -p fixtures/my-new-test/project
   ```

2. **Create `eval.json`** with the schema reference for IDE autocomplete:
   ```json
   {
     "$schema": "../../eval.schema.json",
     "name": "my-new-test",
     "description": "Test that validates specific behavior",
     "prompt": "Your prompt to Claude here",
     "expectedSkills": ["base44-sdk"],
     "checks": [
       {
         "type": "contains",
         "description": "Output mentions the feature",
         "value": "feature"
       }
     ]
   }
   ```

3. **Add project files**: Create `project/.claude/settings.json` and any starter files needed.

4. **Add `AGENTS.md`** with project context for the agent.

5. **Run setup and test**:
   ```bash
   npm run setup
   npm run eval -- --filter my-new-test --verbose
   ```

## eval.json Format

```json
{
  "$schema": "../../eval.schema.json",
  "name": "nextjs-todo-entities",
  "description": "Test creating Todo and Category entities",
  "prompt": "Add entities for a todo app...",
  "expectedSkills": ["base44-cli", "base44-sdk"],
  "checks": [
    {
      "type": "file-exists",
      "description": "Todo entity file created",
      "filePath": "base44/entities/todo.jsonc"
    },
    {
      "type": "file-content",
      "description": "Todo has title property",
      "filePath": "base44/entities/todo.jsonc",
      "pattern": "\"title\"\\s*:\\s*\\{"
    },
    {
      "type": "valid-json",
      "description": "Todo entity is valid JSON",
      "filePath": "base44/entities/todo.jsonc"
    },
    {
      "type": "contains",
      "description": "mentions entities push",
      "value": "entities push"
    }
  ]
}
```

The `$schema` reference enables IDE features like autocomplete, validation, and inline documentation in VS Code and other editors.

## Check Types Reference

| Type | Description | Required Fields | Optional Fields |
|------|-------------|-----------------|-----------------|
| `contains` | Search for text in agent output | `value` | |
| `file-exists` | Verify a file was created | `filePath` | |
| `file-content` | Match content in a file | `filePath` | `pattern`, `value` |
| `valid-json` | Validate JSON/JSONC syntax | `filePath` | |
| `command-passes` | Run a shell command | `command` | |
| `json-schema` | Validate output against schema | `schema` | `filePath` |
| `entity-config` | Validate Base44 entity config | | `filePath`, `target`, `expectedValid` |
| `agent-config` | Validate Base44 agent config | | `filePath`, `target`, `expectedValid` |
| `function-def` | Validate Base44 function config | | `filePath`, `target`, `expectedValid` |

### Check Examples

#### `contains` - Search agent output

Checks if the agent's text output contains a substring (case-insensitive).

```json
{
  "type": "contains",
  "description": "Output mentions entities",
  "value": "entities"
}
```

#### `file-exists` - Verify file creation

Checks if a file exists at the specified path (relative to project directory).

```json
{
  "type": "file-exists",
  "description": "Component file created",
  "filePath": "src/components/TaskList.tsx"
}
```

#### `file-content` - Match file content with regex

Checks if file content matches a regular expression pattern (case-insensitive).

```json
{
  "type": "file-content",
  "description": "Uses React hooks",
  "filePath": "src/components/TaskList.tsx",
  "pattern": "useState|useEffect"
}
```

#### `file-content` - Match file content with exact value

Checks if file contains an exact substring.

```json
{
  "type": "file-content",
  "description": "Imports base44",
  "filePath": "src/components/TaskList.tsx",
  "value": "import base44"
}
```

#### `valid-json` - Validate JSON syntax

Verifies the file contains valid JSON/JSONC (supports `//` and `/* */` comments).

```json
{
  "type": "valid-json",
  "description": "Config is valid JSON",
  "filePath": "base44/entities/todo.jsonc"
}
```

#### `command-passes` - Run shell command

Runs a shell command and passes if exit code is 0. Commands have a 2-minute timeout.

```json
{
  "type": "command-passes",
  "description": "TypeScript compiles",
  "command": "npx tsc --noEmit"
}
```

#### `json-schema` - Validate against JSON Schema

Validates JSON in agent output (or a file) against a JSON Schema definition.

```json
{
  "type": "json-schema",
  "description": "Output matches expected structure",
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "version": { "type": "string" }
    },
    "required": ["name"]
  }
}
```

#### `entity-config` - Validate Base44 entity schema

Validates that a file contains a valid Base44 entity configuration with `name`, `properties`, etc.

```json
{
  "type": "entity-config",
  "description": "Valid entity schema",
  "filePath": "base44/entities/todo.jsonc",
  "target": "file"
}
```

When `target` is omitted or set to `"output"`, extracts entity JSON from the agent's output.

#### `agent-config` - Validate Base44 agent config

Validates that a file contains a valid Base44 agent configuration with `name`, `instructions`, `tool_configs`, etc.

```json
{
  "type": "agent-config",
  "description": "Valid agent configuration",
  "filePath": "base44/agents/support_agent.jsonc",
  "target": "file"
}
```

#### `function-def` - Validate Base44 function config

Validates that a file contains a valid Base44 function definition with `name`, `entrypoint`, etc.

```json
{
  "type": "function-def",
  "description": "Valid function definition",
  "filePath": "base44/functions/my-func/function.jsonc",
  "target": "file"
}
```

## CLI Options

```
-n, --name <name>       Name for this eval run (default: "default")
-a, --agent <agent>     Agent to use (default: "claude-code")
-f, --fixtures <dir>    Fixtures directory (default: "fixtures")
-o, --output <dir>      Output directory for reports (default: "results")
-v, --verbose           Verbose output
--filter <pattern>      Filter fixtures by name pattern
```

## Reports

Reports are generated in `results/` with timestamped filenames:

```
results/
├── run-2026-02-02-143052-default.md
├── run-2026-02-02-150312-with-new-skill.md
└── latest.md → (symlink to most recent)
```

Example report format:

```markdown
# Eval Run: baseline
**Date**: 2026-02-02 15:03:12
**Agent**: claude-code
**Fixtures**: 3

## Summary
| Status | Count |
|--------|-------|
| ✅ Passed | 2 |
| ❌ Failed | 1 |

## nextjs-todo Suite

### ✅ nextjs-todo-entities
**Fixture**: `fixtures/nextjs-todo/`
**Prompt**: Add entities for a todo app...

- **Expected Skills**: base44-cli, base44-sdk ✓
- **Skills Invoked**: base44-cli, base44-sdk
- **Checks**:
  | Check | Status | Details |
  |-------|--------|---------|
  | Todo entity file created | ✅ | File exists |
  | Todo has title property | ✅ | Pattern found |
```

## Adding Custom Checks

To add a new check type:

1. **Create the check class** in `src/checks/`:
   ```typescript
   // src/checks/my-check.ts
   import type { Check, CheckConfig, CheckResult, EvalContext } from '../types.js';

   export class MyCheck implements Check {
     type = 'my-check';
     private config: CheckConfig;

     constructor(config: CheckConfig) {
       this.config = config;
     }

     async run(context: EvalContext): Promise<CheckResult> {
       const { agentResponse, projectDir } = context;

       // Your validation logic here
       const passed = /* ... */;

       return {
         name: this.config.description,
         passed,
         details: passed ? 'Check passed' : 'Check failed',
       };
     }
   }
   ```

2. **Register it** in `src/checks/interface.ts`:
   ```typescript
   import { MyCheck } from './my-check.js';

   // In createCheck function:
   case 'my-check':
     return new MyCheck(config);
   ```

3. **Update the schema** in `eval.schema.json`:
   - Add your type to the `type` enum
   - Add a conditional schema for your check's fields

4. **Update this README** with documentation for your new check type.

### EvalContext

Check implementations receive an `EvalContext` with:

```typescript
interface EvalContext {
  agentResponse: {
    output: string;           // Claude's text response
    skillsInvoked: string[];  // Skills that were invoked
    metadata?: Record<string, unknown>;
  };
  fixtureDir: string;   // Original fixture directory
  projectDir: string;   // Temp directory where agent ran
  checkConfig: CheckConfig;
}
```

## Skill Detection

The eval system detects skill activation by pattern matching in the agent's output:

**base44-cli patterns:**
- `npx base44 entities push`, `functions deploy`, etc.
- File paths like `base44/entities/*.jsonc`
- `Deno.serve`, `createClientFromRequest`

**base44-sdk patterns:**
- `@base44/sdk` imports
- `entities.Task.list()`, `entities.Task.create()`
- `integrations.Core.SendEmail`
- `asServiceRole`
