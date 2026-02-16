# base44 functions deploy

Deploy local function definitions to Base44.

## Syntax

```bash
npx base44 functions deploy
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Scans the `base44/functions/` directory for function definitions
2. Validates that functions exist and have valid configurations
3. Displays the count of functions to be deployed
4. Uploads function code and configuration to Base44
5. Reports the results: deployed and deleted functions

## Prerequisites

- Must be run from a Base44 project directory
- Project must have function definitions in the `base44/functions/` folder
- Each function must have a valid `function.jsonc` config file

## Output

```bash
$ npx base44 functions deploy

Found 2 functions to deploy
Deploying functions to Base44...

Deployed: process-order, send-notification
Deleted: old-function

✓ Functions deployed successfully
```

## Function Synchronization

The deploy operation synchronizes your local functions with Base44:

- **Deployed**: Functions that were created or updated
- **Deleted**: Functions that were removed from your local configuration

## Error Handling

If no functions are found in your project:
```bash
$ npx base44 functions deploy
No functions found. Create functions in the 'functions' directory.
```

If a function has configuration errors:
```bash
$ npx base44 functions deploy
Function deployment errors:
'my-function' function: Entry point cannot be empty
```

## Use Cases

- After creating new functions in your project
- When modifying existing function code or configuration
- To sync function changes before testing
- As part of your development workflow when backend logic changes

## Notes

- This command deploys the function code and configuration
- Changes are applied to your Base44 project immediately
- Make sure to test functions in a development environment first
- Function definitions are located in the `base44/functions/` directory
- For how to create functions, see [functions-create.md](functions-create.md)
