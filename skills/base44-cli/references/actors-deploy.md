# base44 actors deploy

Deploy local actor definitions to Base44.

## Syntax

```bash
npx base44 actors deploy [names...]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `[names...]` | One or more actor names to deploy (deploys all if omitted). Space- or comma-separated | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Scans the `base44/actors/` directory (or `actorsDir` from `base44/config.jsonc`) for actor definitions
2. Discovers actors from `entry.ts`/`entry.js` files — the containing folder is the actor name
3. Displays the count of actors to be deployed
4. Uploads each actor's folder (all `*.js`, `*.ts`, `*.json`, `*.jsonc` files) to Base44, one actor at a time
5. Reports the results: deployed, unchanged, and failed counts

## Prerequisites

- Must be run from a Base44 project directory
- Project must have actor definitions in the `base44/actors/` folder
- Each actor is a folder with `entry.ts` (or `entry.js`) that default-exports a class extending `Actor`

## Examples

```bash
# Deploy all actors
npx base44 actors deploy

# Deploy specific actors
npx base44 actors deploy ChatRoom BoardRoom

# Comma-separated works too
npx base44 actors deploy ChatRoom,BoardRoom
```

## Output

```bash
$ npx base44 actors deploy

◆ Found 2 actors to deploy
◇ [1/2] Deploying ChatRoom...
✓ ChatRoom                     deployed (1.4s)
◇ [2/2] Deploying BoardRoom...
✓ BoardRoom                    unchanged

└ 1 deployed, 1 unchanged
```

## Exit Codes

- **Exit code 0**: All actors deployed successfully (or unchanged)
- **Exit code 1**: One or more actors failed to deploy

A failing actor does not abort the run — the remaining actors are still attempted, then the command prints the full summary and exits with code 1. This makes it safe to use in CI pipelines where a partial failure should block the build.

## Deploying as Part of the Project

`npx base44 deploy` includes actors automatically, in this order:

1. Entities
2. Functions
3. **Actors**
4. Agent skills
5. Agents
6. Auth config
7. Connectors
8. Site

The confirmation summary lists the actor count alongside the other resources.

## Deleting a Deployed Actor

```bash
npx base44 actors delete ChatRoom              # one actor
npx base44 actors delete ChatRoom BoardRoom    # several (comma-separated also works)
```

This tears the actor down on the server: it destroys the published script, so live clients lose the room and a later `actors deploy` starts it fresh. It is a **remote** operation — the local folder is untouched, and the actor does not need to still exist on disk for it to work. Delete the folder yourself if you don't want the next deploy to recreate the actor.

At least one name is required. A name the server doesn't know is reported as `not found` rather than an error, so re-running the command is safe:

```bash
$ npx base44 actors delete ChatRoom
✓ ChatRoom deleted
└ Actor "ChatRoom" deleted
```

## Configuration

The actors directory is configurable in `base44/config.jsonc`:

```jsonc
{
  "name": "My App",
  "actorsDir": "./actors"   // Optional: default "actors"
}
```

## Error Handling

If no actors are found in your project:
```bash
$ npx base44 actors deploy
No actors found. Create actors in the 'actors' directory.
```

If a specified actor name doesn't exist locally:
```bash
$ npx base44 actors deploy Nonexistent
error: Actor not found in project: Nonexistent
```

If `entry.ts` sits directly in the actors directory:
```bash
$ npx base44 actors deploy
error: entry.ts found directly in the actors directory — it must be inside a named subfolder
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `No actors found` | Ensure actors exist as `base44/actors/<Name>/entry.ts` |
| `Actor not found in project: X` | Check the spelling; the actor name is the folder name, case-sensitive |
| `entry.ts found directly in the actors directory` | Move it into a named subfolder (`base44/actors/ChatRoom/entry.ts`) |
| `Duplicate actor name` | One folder holds both `entry.js` and `entry.ts` — keep a single entry file |
| `Invalid actor name '<name>'` | Actor names must match `[A-Za-z_][A-Za-z0-9_]*` (max 128 chars, no `/`, `-`, `.` or `:`) and not be a JavaScript reserved word. Rename the folder in PascalCase |
| `Invalid actor name '<name>' — actors cannot be nested` | Flatten to one folder level, **or** rename a helper you called `entry.ts` (every entry file under `base44/actors/` counts as an actor) |
| `'X' exists as both a backend function and an actor` | Actors and functions share one deploy namespace — rename one of them |
| `'X' cannot have automations` | Actors serve only the realtime WebSocket path; move automation-triggered work into a backend function |
| Deploy rejects the actor as needing the Cloudflare backend | Actors run only on the Cloudflare runtime. A **backend-less** app is activated automatically by this command, but an app already on the Deno runtime cannot host actors and is rejected — migrate the backend first |

The name and nesting checks run **locally at discovery**, before anything uploads, so they cost no network round-trip and cannot leave a deploy half-applied. Everything else in this table comes back from the server.

## Differences from `functions deploy`

| Capability | Functions | Actors |
|------------|-----------|--------|
| Deploy all / by name | Yes | Yes |
| `delete` subcommand | Yes | Yes — `base44 actors delete <names...>` |
| `--force` prune of removed remotes | Yes | No |
| `list` / `pull` subcommands | Yes | No |
| `base44/shared/` uploaded with the resource | Yes | No — only the actor's own folder |
| Local `base44 dev` runtime | Yes | No — verify against a deployed actor |
| Names may be nested / path-like | Yes (`foo/bar`) | No — one folder level, and a JS identifier |

Both deploy **sequentially**, one item at a time. A failing item does not stop its siblings — the remaining actors (or functions) are still attempted — but it does abort the remaining **stages** of `base44 deploy`, so a bad actor blocks everything after step 3 (agent skills, agents, auth, connectors, site).

## Use Cases

- After creating a new actor in your project
- When modifying an actor's logic or message protocol
- To ship realtime changes before testing them in the app
- As part of your deploy workflow whenever realtime behavior changes

## Notes

- Deploy results per actor: `deployed`, `unchanged`, or `error`
- Changes are applied to your Base44 project immediately and served to connecting clients
- The whole actor folder ships on every deploy; anything the entry does not import is dropped from the bundle
- Actor definitions live in the `base44/actors/` directory, one folder per actor
- For how to create actors, see [actors-create.md](actors-create.md)
- For connecting to a deployed actor from your app, see the base44-sdk skill's [actors.md](../../base44-sdk/references/actors.md)
