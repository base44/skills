# Update Skills Cache

Download or refresh the local cache of Anthropic's skills repository for reference during skill reviews.

## Usage

Run the download script to fetch the latest skills from the anthropics/skills repository:

```bash
python3 scripts/download_anthropics_skills.py --force
```

## What This Does

1. Downloads the latest `anthropics/skills` repo from GitHub as a ZIP
2. Extracts and filters to keep only relevant files:
   - `SKILL.md` files from each skill
   - `references/*.md` documentation files
3. Saves to `.cursor/cache/anthropics-skills/`
4. Creates an `INDEX.md` with links to all available skills

## Options

- **Default** (no flags): Only downloads if cache is missing or older than 7 days
- **`--force`**: Force re-download even if cache is fresh
- **`--clean`**: Clear the cache without downloading (useful for troubleshooting)

## After Running

The cache will be available at `.cursor/cache/anthropics-skills/` with:
- `INDEX.md` - List of all available skills
- `skills/<name>/SKILL.md` - Individual skill files
- `skills/<name>/references/` - Reference documentation (if any)

Use these as reference examples when reviewing or creating skills.
