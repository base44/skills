# base44 whoami

Display the currently authenticated user.

## Syntax

```bash
npx base44 whoami
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

- If a workspace API key is present (`BASE44_API_KEY` env var, prefixed `b44k_`), reports that instead of a logged-in user
- Otherwise, reads stored authentication data and displays the email of the currently logged-in user

## Output

```bash
$ npx base44 whoami
Logged in as: user@example.com
```

With a workspace API key set:

```bash
$ npx base44 whoami
Using workspace API key: b44k_abcd12
```

## Use Cases

- Verify you're logged in before running other commands
- Check which account you're currently using
- Confirm authentication is working properly
- Useful in scripts or CI checks to verify credentials

## Notes

- If you're not logged in, the command will prompt you to authenticate first
- The email displayed matches your Base44 account email
- If `BASE44_API_KEY` is set to a workspace API key, `whoami` reports the key (truncated) instead of an email — no interactive login is needed in that case
