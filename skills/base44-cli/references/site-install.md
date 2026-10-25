# base44 site install

Install the site's dependencies with its configured `installCommand`, and nothing else.

## Syntax

```bash
npx base44 site install
```

## Options

None beyond the global options.

## Authentication

**Not required.** This command is local only: no login and no app id required. It calls no API.

## What It Does

1. Reads `site.installCommand` from `base44/config.jsonc` (falling back to the default `npm install` if the project has no `site` block, or no config at all)
2. Runs that command in the project root

## Examples

```bash
# Install the site's dependencies
npx base44 site install
```

## Use Cases

- A machine that only needs a project's dependencies installed — no login, no app id, and no need to go through `create`, `scaffold`, or `eject` first
- The install step of a build pipeline (e.g. a hosted sandbox) that runs `site install` then `base44 build` separately

## Notes

- Runs the command exactly as configured — it does not infer a package manager or add flags
- Unlike `base44 build` and `base44 deploy`, this command does not require an app context: it works even before the project is linked
