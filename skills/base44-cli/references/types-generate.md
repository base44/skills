# base44 types generate

Generate TypeScript declaration file (types.d.ts) from project resources (entities, functions, and agents).

## Syntax

```bash
npx base44 types generate
```

## Authentication

**Required**: No. This command operates on local files only.

## What It Does

1. Reads project configuration from `base44/config.jsonc`
2. Reads all entities, functions, and agents from the project
3. Generates TypeScript type definitions in `base44/.types/types.d.ts`
4. Updates `tsconfig.json` to include the generated types (if tsconfig exists)

## Prerequisites

- Must be run from a Base44 project directory
- Project must have `base44/config.jsonc`

## Output

```bash
$ npx base44 types generate

Generating types...
✓ Types generated successfully

Generated base44/.types/types.d.ts and updated tsconfig.json
```

If no `tsconfig.json` is found:
```bash
$ npx base44 types generate

Generating types...
✓ Types generated successfully

Generated base44/.types/types.d.ts
```

## Generated Types

The command generates TypeScript type definitions for:

- **Entity types** - TypeScript interfaces for each entity schema
- **Function types** - Type definitions for backend functions
- **Agent types** - Type definitions for agent configurations

## Use Cases

- After creating or modifying entities
- After adding or changing functions
- After modifying agent configurations
- To get TypeScript IntelliSense for Base44 resources
- As part of your development workflow

## Notes

- This command is hidden in the CLI help menu (internal/advanced usage)
- The generated types file is located at `base44/.types/types.d.ts`
- If `tsconfig.json` exists, it will be automatically updated to include the types
- Re-run this command whenever you modify entity schemas, functions, or agents
- The command does not require authentication or network access

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 entities push` | Push entities to Base44 (triggers remote type generation) |
| `base44 functions deploy` | Deploy functions to Base44 |
| `base44 agents push` | Push agents to Base44 |
