# base44 whoami

Display the currently authenticated user.

## Syntax

```bash
npx base44 whoami
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

- Reads stored authentication data
- Displays the email of the currently logged-in user

## Output

```bash
$ npx base44 whoami
Logged in as: user@example.com
```

If a workspace API key is active (see below), the output identifies the key instead of a user:

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
- **Workspace API key**: If the `BASE44_API_KEY` environment variable is set to a key starting with `b44k_`, the CLI authenticates every request with that key (sent as the `api_key` header) instead of the normal login session, and `whoami` reports the key prefix rather than an email. This takes priority over any logged-in session.
