# base44 workspace get

Shows details for one workspace (organization) by its ID — name, your role, and subscription tier. Useful when you have a workspace ID and want to know what it is without scanning the full `workspace list`.

## Syntax

```bash
npx base44 workspace get <workspace-id>
```

## Arguments

| Argument       | Description                  | Required |
|----------------|------------------------------|----------|
| `workspace-id` | Workspace (organization) ID  | Yes      |

## Output

Prints the workspace name, ID, your role, and tier. With the global `--json` flag it prints the workspace object:

```bash
npx base44 workspace get 507f191e810c19729de860ea --json
```

```json
{ "id": "507f191e810c19729de860ea", "name": "Acme Inc", "userRole": "admin", "subscriptionTier": "enterprise", "isEnterprise": true, "isPersonal": false }
```

Fails if you are not a member of a workspace with that ID.

## Related

- [workspace-list.md](workspace-list.md) — list all workspaces you belong to
- [workspace-move.md](workspace-move.md) — move an app between workspaces
