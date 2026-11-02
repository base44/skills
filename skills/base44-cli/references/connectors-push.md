# base44 connectors push

Push local connector configurations to Base44, adding new connectors, updating scopes, and handling OAuth authorization. Remote connectors missing locally are only removed with `--force`.

## Usage

```bash
npx base44 connectors push [--dir <path>] [--force] [-y]
```

## Options

| Option | Description | Required |
|--------|--------------|----------|
| `--dir <path>` | Directory to read connector files from. Only used with `--app-id` (no local project); defaults to `./connectors` | No |
| `--force` | Remove connectors on Base44 that are not in your local files | No |
| `-y, --yes` | Skip the `--force` confirmation prompt | No |

## Removing Connectors (`--force`)

By default, `connectors push` only adds and updates — remote connectors that aren't in your local files are left alone. This matches `functions deploy`, and keeps connectors set up outside the project (for example Stripe installed through the API or MCP, or a connector created with `connectors initiate`) from being removed by accident.

Pass `--force` to also remove remote connectors that aren't in your local files. The CLI warns you and asks for confirmation:

```bash
$ npx base44 connectors push --force

Found 2 connectors to push: googlecalendar, slack
⚠ This will remove any connectors on Base44 that are not present locally.
? Are you sure you want to continue? › Yes
```

In non-interactive mode (`--json`, CI/CD, no TTY), `--force` requires `-y`/`--yes` or the command throws. Without `--force`, there is no confirmation prompt.

**Warning:** Removing Stripe deletes its sandbox, keys, and claim link. Backend functions that use a removed connector fail until it is set up again.

If your connectors directory is empty, the command exits with `No local connectors found - nothing to push` and removes nothing, even with `--force`.

## Projectless Mode

`connectors push` can run without a local project by passing `--app-id` (or setting `BASE44_APP_ID`). In that mode there's no `config.jsonc` to read connectors from, so files are read from `./connectors` by default — override with `--dir`.

## JSON Output

Pass the global `--json` flag to get a machine-readable result instead of human-oriented log lines and prompts (OAuth authorization is skipped automatically in `--json` mode, same as any non-interactive run):

```bash
npx base44 connectors push --json
```

## What It Does

1. **Reads local connectors** from your `base44/connectors/` directory
2. **Syncs with Base44** - updates scopes for existing connectors
3. **Adds new connectors** - new OAuth connector types trigger authorization; Stripe is provisioned automatically
4. **Removes unlisted connectors (only with `--force`)** - connectors not in your local files are removed from Base44

## OAuth Authorization Flow

When you add a new connector, it needs to be authorized:

1. The CLI detects which connectors need authorization
2. You're prompted: "Open browser to authorize now?"
3. If you accept, the browser opens to the OAuth provider (Google, Slack, etc.)
4. You log into your account and approve the requested permissions
5. The browser closes and the CLI confirms authorization

**Important**: You choose which account to connect by logging into it during the OAuth flow. For example, if you have multiple Google accounts, you select which one to use in the Google login screen.

## Example Output

### Pushing connectors (no new authorization needed)

```
Found 2 connectors to push: googlecalendar, slack
✓ Connectors pushed

Summary:
  Synced: googlecalendar, slack
```

### Pushing new connectors (authorization required)

```
Found 3 connectors to push: googlecalendar, slack, notion
✓ Connectors pushed

2 connector(s) require authorization in your browser:
  slack: https://auth.base44.io/oauth/...
  notion: https://auth.base44.io/oauth/...

? Open browser to authorize now? › Yes

Opening browser for slack...
✓ slack authorization complete

Opening browser for notion...
✓ notion authorization complete

Summary:
  Synced: googlecalendar
  Added: slack, notion
```

### Pushing Stripe (no OAuth required)

Stripe is provisioned automatically — no browser flow is needed:

```
Found 2 connectors to push: googlecalendar, stripe
✓ Connectors pushed

Summary:
  ✓ Stripe sandbox provisioned
    Claim your Stripe sandbox: https://dashboard.stripe.com/...
    Connectors dashboard: https://app.base44.com/...
  Synced: googlecalendar
```

### Removing connectors

If you delete a connector file locally and push with `--force`, it is removed (without `--force`, it stays on Base44):

```
Found 1 connectors to push: googlecalendar
✓ Connectors pushed

Summary:
  Synced: googlecalendar
  Removed: slack
```

## CI/CD Environments

In non-interactive environments (no TTY, such as CI/CD pipelines), the OAuth flow is skipped automatically:

```
Skipped OAuth in non-interactive mode. Run 'base44 connectors push' locally or open the links above to authorize.
```

You must run `npx base44 connectors push` locally to complete authorization for new connectors.

## Skipping Authorization

If you choose not to authorize immediately, the connectors remain in a pending state:

```
? Open browser to authorize now? › No

Authorization skipped. Pending: slack, notion. Run 'base44 connectors push' again to complete.
```

Run the command again when you're ready to authorize.

## Summary Status Meanings

| Status | Meaning |
|--------|---------|
| Provisioned | Stripe sandbox was created automatically (no OAuth needed) |
| Synced | Connector already existed, scopes updated if needed |
| Added | New connector successfully authorized via OAuth |
| Removed | Connector was deleted from Base44 (not in local files, `--force` only) |
| Failed | Authorization timed out, failed, or was skipped |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Authorization timed out | Re-run `npx base44 connectors push` and complete OAuth faster |
| Authorization failed | Check that you approved all requested permissions |
| Wrong account connected | Remove the connector file, run `connectors push --force` to delete it, then add it back and authorize with the correct account |
| Browser didn't open | Copy the URL shown in the terminal and open it manually |

## Related Commands

- [connectors-create.md](connectors-create.md) - How to create connector configuration files
- [connectors-pull.md](connectors-pull.md) - Pull connectors from Base44 to local files
