# base44 logout

Logout from current device and clear stored authentication data.

## Syntax

```bash
npm run base44 logout
# or
yarn base44 logout
# or
pnpm base44 logout
```

## Authentication

**Required**: No

## What It Does

- Deletes stored authentication data from your device
- Clears your local session
- Removes access and refresh tokens

## Output

```bash
$ npm run base44 logout
Logged out successfully
```

## Notes

- You can logout even if you're not currently logged in (no error)
- After logout, you'll need to run `npm run base44 login` again to use authenticated commands
- This only affects the current device; your Base44 account remains active
