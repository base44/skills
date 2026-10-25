# base44 site install

Install the site's dependencies with its configured install command, and nothing else.

## Syntax

```bash
npx base44 site install
```

## Options

This command takes no options.

## Authentication

**Not required.** Local only: no login and no app id are needed.

## What It Does

1. Reads `site.installCommand` from `base44/config.jsonc` (defaults to `npm install` when the project has no `site` block, or the block doesn't name one)
2. Runs it in the project root
3. Reports success or failure

## Examples

```bash
# Install the site's dependencies
npx base44 site install
```

## Use Cases

- A machine that only needs a project's dependencies installed, without going through `create`, `scaffold`, or `eject` first — e.g. a CI step or a hosted build/dev sandbox that only has the checked-out repo
- Installing dependencies before running `base44 site dev` or `base44 build`

## Notes

- Reads no app context and calls no API — it works before `base44 login` and before the project is linked to an app
- Does not read entities, functions, or any other resource files — an invalid `base44/config.jsonc` resource section does not block it
- `installCommand` defaults to the convention `base44 create` scaffolds (`npm install`); set `site.installCommand` in `base44/config.jsonc` to override it

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 site dev` | Run only the site's dev server |
| `base44 build` | Build the site with the app id injected |
| `base44 dev` | Run the local backend, and the frontend too if configured |
