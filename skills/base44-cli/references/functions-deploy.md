# base44 functions deploy

Deploy local function definitions to Base44.

## Syntax

```bash
npx base44 functions deploy [names...] [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `[names...]` | One or more function names to deploy (deploys all if omitted) | No |
| `--force` | Delete remote functions not found locally (cannot be combined with `[names...]`) | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Scans the `base44/functions/` directory for function definitions
2. Discovers functions from `entry.ts`/`entry.js` files
3. Displays the count of functions to be deployed
4. Uploads function code to Base44 sequentially
5. Reports the results: deployed, unchanged, and failed counts
6. If `--force` is used: also deletes remote functions that no longer exist locally

## Prerequisites

- Must be run from a Base44 project directory
- Project must have function definitions in the `base44/functions/` folder
- Each function should be a folder with `entry.ts` or `entry.js`

## Examples

```bash
# Deploy all functions
npx base44 functions deploy

# Deploy specific functions
npx base44 functions deploy process-order send-notification

# Deploy all and delete functions removed locally
npx base44 functions deploy --force
```

## Output

```bash
$ npx base44 functions deploy

◆ Found 2 functions to deploy
◇ [1/2] Deploying process-order...
✓ process-order               deployed
◇ [2/2] Deploying send-notification...
✓ send-notification           deployed

└ 2 deployed
```

With `--force`:
```bash
$ npx base44 functions deploy --force

◆ Found 2 functions to deploy
...

◆ Found 1 remote function to delete
◇ [1/1] Deleting old-function...
✓ old-function                deleted

◆ 1 deleted

└ 2 deployed
```

## Exit Codes

- **Exit code 0**: All functions deployed successfully (or unchanged)
- **Exit code 1**: One or more functions failed to deploy

When any function fails, the command prints the full deploy summary and exits with code 1. This makes it safe to use in CI pipelines where a partial failure should block the build.

## Error Handling

If no functions are found in your project:
```bash
$ npx base44 functions deploy
No functions found. Create functions in the 'functions' directory.
```

If `--force` is combined with function names:
```bash
$ npx base44 functions deploy my-func --force
error: --force cannot be used when specifying function names
```

If a specified function name doesn't exist locally:
```bash
$ npx base44 functions deploy nonexistent
error: Function not found in project: nonexistent
```

## Use Cases

- After creating new functions in your project
- When modifying existing function code
- To sync function changes before testing
- As part of your development workflow when backend logic changes
- Use `--force` to clean up remote functions that have been removed locally

## Notes

- This command deploys function code
- Changes are applied to your Base44 project immediately
- Deploy results per function: `deployed`, `unchanged`, or `error`
- `--force` cannot be combined with specific function names
- Make sure to test functions in a development environment first
- Function definitions are located in the `base44/functions/` directory
- Use `entry.ts` or `entry.js` for functions
- For how to create functions, see [functions-create.md](functions-create.md)
