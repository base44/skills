# base44 site install

Install the site's dependencies with its configured command.

## Syntax

```bash
npx base44 site install
```

## Options

This command defines no options.

## Authentication

**Required**: No. Runs without logging in.

## Requirements

- No app context required: no app id needs to be resolved and no API is called
- `base44/config.jsonc` is optional: if missing, gitignored, or invalid, the command falls back to the default `installCommand` (`npm install`) and logs a warning instead of failing

## What It Does

1. Reads the project's `site.installCommand`, defaulting to `npm install` if the project has no `site` block (or no `installCommand` configured)
2. Runs that command from the project root via a shell
3. Reports success or failure

It runs **only** the install command — nothing else. Unlike `create`, `scaffold`, or `eject`, it does not scaffold files, write config, or touch any other project resources.

## Examples

```bash
npx base44 site install
```

```
Installing site dependencies...
✓ Dependencies installed

Installed with npm install
```

## Error Handling

If the configured `installCommand` exits non-zero, the command fails and reports `Install failed`.

## Use Cases

- A build/CI sandbox that needs a project's frontend dependencies installed but has never logged in and has no `base44/.app.jsonc`
- Installing dependencies as a discrete step in a pipeline, without pulling in `create`/`scaffold`/`eject` machinery

## Notes

- Local only: no login and no app id required — this is the point of the command
- Works even if a resource file (entity/function/etc.) is invalid — installing reads only the site config, not the rest of the project
- Falls back to `npm install` when the `site` block names no `installCommand`
