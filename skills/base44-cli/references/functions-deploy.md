# base44 functions deploy

Deploy local function definitions to Base44.

## Syntax

```bash
npx base44 functions deploy [names...] [options]
```

## Arguments & Options

| Argument/Option | Description | Required |
|--------|-------------|----------|
| `names...` | Function names to deploy (deploys all if omitted) | No |
| `--force` | Delete remote functions not found locally | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Scans the `base44/functions/` directory for function definitions
2. Validates that functions exist and have valid configurations
3. Displays the count of functions to be deployed
4. Deploys functions sequentially, showing per-function progress and status
5. Reports each function as `deployed`, `unchanged`, or `error`
6. With `--force`: also deletes remote functions that no longer exist locally

## Prerequisites

- Must be run from a Base44 project directory
- Project must have function definitions in the `base44/functions/` folder
- Each function must have a valid `function.jsonc` config file

## Examples

```bash
# Deploy all functions
npx base44 functions deploy

# Deploy specific functions
npx base44 functions deploy my-function another-function

# Deploy specific functions using comma-separated names
npx base44 functions deploy my-function,another-function

# Deploy all and remove remote functions not found locally
npx base44 functions deploy --force
```

## Output

```bash
$ npx base44 functions deploy

Found 2 functions to deploy
[1/2] Deploying process-order...
process-order             deployed (1.2s)
[2/2] Deploying send-notification...
send-notification         unchanged

2 deployed, 0 unchanged
```

With `--force`:
```bash
$ npx base44 functions deploy --force

Found 2 functions to deploy
...
Found 1 remote functions to delete
[1/1] Deleting old-function...
old-function              deleted

1 deleted
```

## Error Handling

If no functions are found in your project:
```bash
$ npx base44 functions deploy
No functions found. Create functions in the 'functions' directory.
```

If specified function names are not found locally:
```bash
$ npx base44 functions deploy nonexistent
Function not found in project: nonexistent
```

## Notes

- `--force` cannot be combined with specific function names
- Function names support comma-separated values: `fn-a,fn-b` is equivalent to `fn-a fn-b`
- Changes are applied to your Base44 project immediately
- For how to create functions, see [functions-create.md](functions-create.md)
- To delete specific remote functions, use [`base44 functions delete`](functions-delete.md)
- To list remote functions, use [`base44 functions list`](functions-list.md)
