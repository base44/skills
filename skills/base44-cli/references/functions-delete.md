# base44 functions delete

Delete one or more deployed functions from Base44.

## Syntax

```bash
npx base44 functions delete <names...>
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `names...` | Function names to delete | Yes (at least one) |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Examples

```bash
# Delete a single function
npx base44 functions delete my-function

# Delete multiple functions
npx base44 functions delete my-function another-function

# Delete multiple functions using comma-separated names
npx base44 functions delete my-function,another-function
```

## Output

```bash
$ npx base44 functions delete my-function
✓ my-function deleted

Function "my-function" deleted
```

```bash
$ npx base44 functions delete fn-a fn-b
✓ fn-a deleted
✓ fn-b deleted

2/2 deleted
```

If a function is not found:
```bash
$ npx base44 functions delete nonexistent
Function "nonexistent" not found
```

## Notes

- Function names support comma-separated values: `fn-a,fn-b` is equivalent to `fn-a fn-b`
- If a function is not found on remote, it reports "not found" without error
- To list all remote functions before deleting, use [`base44 functions list`](functions-list.md)
- To remove functions that no longer exist locally during a deploy, use `base44 functions deploy --force`
