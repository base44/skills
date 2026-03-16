# base44 functions list

List all deployed functions on Base44 remote.

## Syntax

```bash
npx base44 functions list
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Examples

```bash
npx base44 functions list
```

## Output

```bash
$ npx base44 functions list

  process-order (2 automations)
  send-notification
  validate-input

3 functions on remote
```

If no functions are deployed:
```bash
$ npx base44 functions list
No functions on remote
```

## Notes

- Shows functions currently deployed on the Base44 remote (not local files)
- Displays automation count for functions that have automations configured
- Use this command before `base44 functions delete` to confirm function names
