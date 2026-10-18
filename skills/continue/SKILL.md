---
name: continue
description: Continue the current Claude Code or Codex session in a Base Code branch of a Base44 app that was imported from a repository. Use when the user runs /base44:continue or asks to move, hand off, or continue this conversation in Base44 or Base Code.
disable-model-invocation: true
allowed-tools: Bash(npx base44@latest session import *)
---

# Continue this session in Base Code

Moves this conversation into a new Base Code branch, so the Base44 agent picks up where this session stopped. The user types one command and never opens a terminal. The Base44 CLI reads this session's transcript from disk and uploads only the user and assistant text. Tool calls and their output stay on this machine.

## Requirements

- The Base44 app was imported from a repository. Other apps get a 404.
- The feature is in early access, so it needs to be on for the user's account.
- The Base44 CLI release that ships `session import`. If the command prints `unknown command 'session'`, tell the user to update with `npm install -g base44@latest`, then run it again.

## Steps

1. Run the import with this session's id. Claude Code fills in the id below. Codex does not substitute it, so there the line still reads `${CLAUDE_SESSION_ID}` literally: use `"$CODEX_THREAD_ID"` instead.

   ```bash
   npx base44@latest session import --session "${CLAUDE_SESSION_ID}" --yes --json
   ```

2. Resolve the app if the command fails with `No Base44 app ID found`. It reads `base44/.app.jsonc`, then `--app-id`, then `BASE44_APP_ID`. Ask the user for the app id (the `<id>` in the editor URL `/apps/<id>/`), and run again with `--app-id <id>` before `session`.

3. Sign in if the command prints a login URL and a code. Show both to the user and wait while the command polls. Never ask for a password.

4. Report the result from the JSON on stdout: `branchName` and `url`. `created: false` means an identical import already made that branch, so say it was already there. Give the user the `url`.

## Notes

- Large sessions are trimmed to the latest messages that fit the size limit. The command says so on stderr, so tell the user.
- Running it again after the session grows makes a new branch with the longer history.
- A 404 means the app is not an imported app, or early access is off for the account. Say so and stop.
- Never paste the transcript into this conversation or into a command. The CLI reads it from disk.
