# base44 workspace list

List the workspaces (organizations) you belong to.

Does not require a linked project — works from any directory.

## Syntax

```bash
npx base44 workspace list [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--role <role>` | Only show workspaces where your role matches (`owner`, `admin`, `editor`, `viewer`) | No |

## Examples

```bash
# List all workspaces you belong to
npx base44 workspace list

# Only workspaces where you're an owner
npx base44 workspace list --role owner

# Machine-readable output
npx base44 workspace list --json
```

## Output

Human mode prints each workspace's name, role/personal tag, and ID. With `--json`, stdout is an array of workspace objects: `id`, `name`, `userRole`, `subscriptionTier`, `isEnterprise`.

## Notes

- Use this to find a workspace ID for `base44 create --workspace <id>`, `base44 link --workspace <id>`, or `base44 workspace move <id>`.
