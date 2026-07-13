# base44 workspace list

Lists the workspaces (organizations) your account belongs to, with your role in each. Use it to find the workspace ID for `base44 create --workspace` or `base44 workspace move`.

Your personal workspace is listed first.

## Syntax

```bash
npx base44 workspace list
```

## Output

Each workspace shows its name, ID, and your role (e.g. `personal, owner` or `admin`).

For scripts, add the global `--json` flag to get a machine-readable array:

```bash
npx base44 workspace list --json
```

```json
[
  { "id": "507f1f77bcf86cd799439011", "name": "My Workspace", "userRole": "owner", "isPersonal": true },
  { "id": "507f191e810c19729de860ea", "name": "Acme Inc", "userRole": "admin", "isPersonal": false }
]
```

## Notes

- Requires authentication (`npx base44 whoami` should succeed).
- Only workspaces where your role is `owner`, `admin`, or `editor` can be used as a target for creating or moving apps.

## Related

- [create.md](create.md) — create an app in a workspace with `--workspace`
- [workspace-move.md](workspace-move.md) — move an app between workspaces
