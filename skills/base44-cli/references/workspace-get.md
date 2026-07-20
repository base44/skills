# base44 workspace get

Show details for a single workspace by ID.

Does not require a linked project — works from any directory.

## Syntax

```bash
npx base44 workspace get <workspace-id>
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `workspace-id` | Workspace (organization) ID | Yes |

## Examples

```bash
npx base44 workspace get 507f1f77bcf86cd799439011

# Machine-readable output
npx base44 workspace get 507f1f77bcf86cd799439011 --json
```

## Output

Human mode prints the workspace's name, role/personal tag, ID, and subscription tier (if any). With `--json`, stdout is the workspace object: `id`, `name`, `userRole`, `subscriptionTier`, `isEnterprise`.

## Errors

- If the workspace doesn't exist, or you're not a member of it, the command fails with a hint to run `base44 workspace list`.
