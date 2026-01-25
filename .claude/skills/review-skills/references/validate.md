# Skill Validation Checklist

Quick validation checklist for Agent Skills. Use this to verify a skill meets basic requirements before full review.

## How to Validate

Given a skill path (e.g., `skills/my-skill/`), perform these checks in order:

### 1. File Structure

- [ ] `SKILL.md` file exists in the skill directory

### 2. Frontmatter Format

- [ ] File starts with `---` (YAML frontmatter delimiter)
- [ ] Frontmatter ends with `---` on its own line
- [ ] Content between delimiters is valid YAML

### 3. Allowed Properties

Only these top-level properties are allowed in frontmatter:

| Property | Required |
|----------|----------|
| `name` | Yes |
| `description` | Yes |
| `license` | No |
| `compatibility` | No |
| `metadata` | No |
| `allowed-tools` | No |

- [ ] No unexpected properties exist (check for typos like `descriptions`, `Name`, etc.)

### 4. Name Validation

- [ ] `name` field exists
- [ ] Value is a string (not a number or list)
- [ ] Uses hyphen-case only: lowercase letters (`a-z`), digits (`0-9`), and hyphens (`-`)
- [ ] Does NOT start with a hyphen
- [ ] Does NOT end with a hyphen
- [ ] Does NOT contain consecutive hyphens (`--`)
- [ ] Maximum 64 characters

**Valid examples:** `pdf-processing`, `code-review`, `my-skill-v2`

**Invalid examples:** `PDF-Processing` (uppercase), `-pdf` (starts with hyphen), `pdf--tool` (consecutive hyphens)

### 5. Description Validation

- [ ] `description` field exists
- [ ] Value is a string (not a number or list)
- [ ] Does NOT contain angle brackets (`<` or `>`)
- [ ] Maximum 1024 characters
- [ ] Non-empty (has actual content)

### 6. Directory Name Match

- [ ] Skill directory name matches the `name` field value

## Validation Result Format

Report validation results as:

```
**Validation**: [PASS/FAIL]
- [List any failures with specific details]
```

### Example Pass

```
**Validation**: PASS
- All checks passed
```

### Example Fail

```
**Validation**: FAIL
- Name 'My-Skill' contains uppercase characters (must be hyphen-case)
- Description exceeds 1024 characters (found 1203)
```

## Quick Reference: Common Failures

| Issue | Fix |
|-------|-----|
| `name` has uppercase | Convert to lowercase: `My-Skill` → `my-skill` |
| `name` has spaces | Replace with hyphens: `my skill` → `my-skill` |
| `name` has underscores | Replace with hyphens: `my_skill` → `my-skill` |
| `description` has `<tags>` | Remove angle brackets or escape them |
| Unknown property | Check spelling, remove if not in allowed list |
| Missing frontmatter | Add `---` delimiters with required fields |
