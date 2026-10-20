# Contributing

Thank you for contributing to Base44 SDK Skills! This guide covers how to create and submit new skills.

## Creating a Skill

### 1. Start from the Template

Copy the template directory to create a new skill:

```bash
cp -r skills/_template skills/.experimental/your-skill-name
```

### 2. Skill Structure

Each skill is a directory containing at minimum a `SKILL.md` file:

```
your-skill-name/
├── SKILL.md           # Required: Skill definition
├── scripts/           # Optional: Automation scripts
│   └── example.sh
└── references/        # Optional: Additional documentation
    └── examples.md
```

### 3. SKILL.md Format

The `SKILL.md` file requires YAML frontmatter with two required fields:

```yaml
---
name: your-skill-name
description: What this skill does and when to use it.
---
```

#### Required Fields

| Field | Description |
|-------|-------------|
| `name` | Unique identifier. Lowercase, hyphens allowed. No spaces. |
| `description` | Brief explanation including trigger phrases for when agents should use this skill. |

#### Optional Fields

| Field | Description |
|-------|-------------|
| `allowed-tools` | List of tools the skill can use |

### 4. Recommended Sections

Structure your `SKILL.md` with these sections:

1. **Title** - `# Skill Name`
2. **Overview** - Brief description
3. **When to Use** - Trigger conditions and keywords
4. **How It Works** - Step-by-step workflow
5. **Usage** - Code examples
6. **Parameters** - Input descriptions (if applicable)
7. **Output** - What the skill produces
8. **Troubleshooting** - Common issues and solutions

## Naming Conventions

- Use lowercase with hyphens: `entity-crud`, `auth-setup`
- Be descriptive but concise
- Prefix with category when helpful: `base44-entities`, `base44-auth`

## Skill Categories

### `.curated/`

Production-ready skills that are:

- Thoroughly tested
- Well-documented
- Following all guidelines
- Reviewed and approved

### `.experimental/`

Work-in-progress skills that are:

- Functional but may have rough edges
- Still being refined
- Open for feedback

## Testing Your Skill

1. Install locally to test:

```bash
# From the repo root
npx skills add . --skill your-skill-name -a cursor
```

2. Verify the skill loads in your agent
3. Test with various prompts that should trigger the skill
4. Check edge cases and error handling

## Submitting a Skill

1. **Fork** this repository
2. **Create** your skill in `skills/.experimental/`
3. **Test** thoroughly with multiple agents
4. **Submit** a pull request with:
   - Clear description of what the skill does
   - Example use cases
   - Any dependencies or requirements

## Code Style

- Use clear, descriptive variable names in examples
- Include comments explaining non-obvious code
- Prefer modern JavaScript/TypeScript syntax
- Follow Base44 SDK conventions

## Compiled platform skills (`base44-platform-*`)

The `skills/base44-platform-*` directories are **generated**. Their source is the Base44 builder's
system prompt tree in [base44-dev/apper](https://github.com/base44-dev/apper)
(`backend/app/prompts/`), rendered for an external coding agent by the compiler in
`backend/scripts/agent_skills` and published here by apper's nightly `agent-skills-sync` workflow.
They describe the platform exactly as the in-editor AI learns it, one reference per app shape.

### How the pipeline works

1. **Nightly, in apper**: the compiler renders every prompt partial in the capability matrix
   (`backend/app/user_apps/agent_skills/matrix.py`) with `surface="external"`, validates the result
   (deterministic output, no builder-tool vocabulary, manifest, links) and opens one PR here on the
   branch `auto/base44-platform-skills`, labeled `auto-skill-update`. A night with no prompt change
   opens nothing.
2. **In this repo**: `Validate base44-platform skills` (`scripts/validate-base44-platform.mjs`)
   checks that the PR carries exactly what the compiler emitted: the generated-file header on every
   file, sha256 hashes matching `skills/base44-platform-manifest.json`, frontmatter whose `name`
   equals the directory name, resolving links, and a 40-hex `APPER_COMMIT` pin.
3. `Auto-merge compiled skill updates` enables squash auto-merge on a labeled PR opened by the sync
   app whose diff is confined to `skills/base44-platform-*/**` and `APPER_COMMIT`. Everything else
   waits for a human. The Slack notifier posts the PR like any other skill-sync PR.

### How to change a compiled skill

Do not edit these files here: the validator fails on a hand edit, and the next sync overwrites it.
Change the source instead:

- **Wording that is wrong for every agent** (builder and external alike): edit the prompt partial in
  apper under `backend/app/prompts/`. The nightly sync carries it here.
- **Wording that only an external agent needs** (a builder-tool instruction with no external
  equivalent, a pointer to the MCP / CLI surface): use the `external` branch inside the partial,
  `{% if external %}…{% else %}…{% endif %}`. The builder's render stays byte-identical and is
  pinned by hash tests. The convention is documented in apper's `backend/app/prompts/CLAUDE.md`
  (Rule 4).
- **A new capability, app shape or reference file**: add it to the matrix in apper and classify the
  partial there. Nothing in this repo needs to change; the sync adds the directory.
- **A flag that reached 100%** but still gates prompt text: add it to
  `backend/app/user_apps/agent_skills/shipped_overrides.json` in apper, so the skills describe the
  shipped arm.

`APPER_COMMIT` names the apper commit the current tree was compiled from; the sync PR body lists
the prompt-source commits since the previous pin.

### Which reference an agent should read

Each `base44-platform-*` skill's `SKILL.md` routes by app profile (Vite SPA, TanStack Start, native
mobile, 2D or 3D game). The platform answers that question directly:
`GET /api/apps/{app_id}/agent-profile` (public API, also reachable through the Base44 MCP
`execute_api` tool) returns the app's shape, the workspace's entitlements and the exact reference
paths to read.

### Operating the pipeline (maintainers)

- The sync PR is opened with a GitHub App installed on this repository (contents and pull requests,
  write). Apper reads it from `vars.BASE44_SKILLS_APP_ID` and `secrets.BASE44_SKILLS_APP_PRIVATE_KEY`;
  this repo needs `vars.SKILLS_SYNC_BOT_LOGIN` set to the app's login so auto-merge recognizes its PRs.
- Auto-merge must be enabled in the repository settings, with `Validate base44-platform skills` as
  a required check on `main`.
- `.github/CODEOWNERS` routes the generated tree and the two workflows to the owning team.
- To rerun a sync by hand, dispatch apper's `Agent skills sync` workflow (it has a dry-run input).

## Questions?

- Check existing skills for examples
- Review the [Base44 SDK Documentation](https://docs.base44.com)
- Open an issue for questions or suggestions
