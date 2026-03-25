# base44 auth pull

Pull auth config from Base44 to a local file.

## Syntax

```bash
npx base44 auth pull
```

## What It Does

1. Fetches the current auth configuration from Base44
2. Writes it to the local auth config file in `base44/auth/` (overwriting the local file)

## Options

None.

## Examples

```bash
# Pull auth config from Base44
npx base44 auth pull
```

## Notes

- **Hidden command**: Not shown in `--help` output but fully functional.
- The auth config is written to the `authDir` defined in your `base44/config.jsonc` (defaults to `base44/auth/`).
- This overwrites any local auth config file — useful to reset local changes back to the remote state.
- After pulling, use `base44 auth push` or `base44 deploy` to push any local edits back to Base44.

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 auth push` | Push local auth config to Base44 |
| `base44 auth password-login` | Enable or disable username & password authentication |
| `base44 deploy` | Deploy all resources including auth config |
