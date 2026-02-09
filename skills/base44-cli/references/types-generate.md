# base44 types generate

Generate TypeScript declaration file (types.d.ts) from project resources.

## Syntax

```bash
npx base44 types generate
```

## Authentication

**Required**: No (type generation is a local operation)

## What It Does

1. Reads project configuration and resources (entities, functions, agents)
2. Generates TypeScript type definitions based on your project resources
3. Writes the types to `base44/.types/types.d.ts`
4. Updates `tsconfig.json` to include the generated types (if tsconfig.json exists)

## Prerequisites

- Must be run from a Base44 project directory
- Project must have `base44/config.jsonc` configuration file

## Output

```bash
$ npx base44 types generate

Generating types...
✓ Types generated

Generated base44/.types/types.d.ts and updated tsconfig.json
```

If no `tsconfig.json` is found:
```bash
$ npx base44 types generate

Generating types...
✓ Types generated

Generated base44/.types/types.d.ts
```

## What Gets Generated

The generated types file includes TypeScript definitions for:

- **Entities**: Type definitions matching your entity schemas
- **Functions**: Function signatures for your backend functions
- **Agents**: Agent configuration types

## Use Cases

- After creating or modifying entities to get updated types
- Setting up TypeScript in your project for the first time
- Getting IntelliSense and autocomplete for your Base44 resources
- Ensuring type safety when working with entities and functions

## TypeScript Configuration

If a `tsconfig.json` file exists in your project root, the command will automatically add the types path to the `include` array:

```json
{
  "include": [
    "src",
    "base44/.types/types.d.ts"
  ]
}
```

## Notes

- This is a local operation - it doesn't require authentication or network access
- The generated file is created in `base44/.types/types.d.ts`
- Re-run this command whenever you change your entity schemas, functions, or agents
- The types file should not be edited manually - it will be overwritten on next generation
