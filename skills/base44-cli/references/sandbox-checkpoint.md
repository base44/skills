# base44 sandbox checkpoint

Save a restore point in the builder's version history. Run this after each unit of work in the sandbox, and always before you stop.

## Syntax

```bash
npx base44 sandbox checkpoint [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--name <name>` | Title for the checkpoint, ideally a short summary of what changed | No | auto-generated title |

This command also accepts the global `--branch <name>` option and requires an app context (`--app-id`, `BASE44_APP_ID`, or a linked project).

## Examples

```bash
# Checkpoint with an auto-generated title
npx base44 sandbox checkpoint

# Checkpoint with a descriptive name
npx base44 sandbox checkpoint --name "before refactor"
```

## Output

Always a JSON document on stdout:

```json
{ "checkpointId": "chk_123", "name": "before refactor", "gitCommitHash": "a1b2c3d" }
```

## Why This Matters

Every `sandbox write`, `sandbox edit`, and `sandbox run` writes to the app, and that write is **committed but not checkpointed**. Only checkpoints show up in the builder's version history (Base44's web-based app editor). If someone uses Restore or Revert there, the app rolls back to the **last checkpoint** and everything written after it is discarded — even though it was already committed.

In practice: run `base44 sandbox checkpoint` after each unit of work and always before you stop working, so the user can restore your progress instead of silently losing it. Pending changes are flushed before the checkpoint is taken, so it always captures your latest code.

## Notes

- This is the only sandbox subcommand that doesn't write app files directly — it's how you make prior writes durable against a Restore/Revert in the builder.
- `--name` is cosmetic (shows up in the builder's history list); omit it and a title is generated automatically.
