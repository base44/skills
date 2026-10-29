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
own system prompt, rendered for an external coding agent by Base44's internal compiler and
published here by a sync workflow that Base44 runs by hand. They describe the platform exactly as
the in-editor AI learns it, one reference per app shape.

### How the pipeline works

1. **At Base44**: the compiler renders every prompt partial in its capability matrix for the
   external surface, drops passages marked internal, and validates the result (deterministic output,
   no builder-tool vocabulary, no internal names, manifest, links). An IP review then reads the tree
   that would be published; a tree it flags stays inside Base44 until an engineer has read the
   findings and approved it. The sync opens one PR here on the branch `auto/base44-platform-skills`,
   labeled `auto-skill-update`, with the review's report in its body. No change, no PR.
2. **In this repo**: `Validate base44-platform skills` (`scripts/validate-base44-platform.mjs`)
   checks that the PR carries exactly what the compiler emitted: the generated-file header on every
   file, sha256 hashes matching `skills/base44-platform-manifest.json`, frontmatter whose `name`
   equals the directory name, resolving links, and a 40-hex `SOURCE_COMMIT` pin.
3. `Auto-merge compiled skill updates` enables squash auto-merge on a labeled PR opened by
   `base44-github-actions[bot]` whose diff is confined to `skills/base44-platform-*/**` and
   `SOURCE_COMMIT`. A PR published on an engineer's approval after review findings waits for a
   human merge; so does everything else. The Slack notifier posts the PR like any other skill-sync PR.

### How to change a compiled skill

Do not edit these files here: the validator fails on a hand edit, and the next sync overwrites it.
Open an issue describing the wrong or missing content, or, as a Base44 engineer, change the source
prompt: wording wrong for every agent is fixed in the shared partial; wording only an external agent
needs goes in the partial's external branch; a new capability, app shape or reference is added to the
matrix; a passage that must not be public is marked internal. The next sync carries it here.

`SOURCE_COMMIT` names the source commit the current tree was compiled from.

### Which reference an agent should read

Each `base44-platform-*` skill's `SKILL.md` routes by app profile (Vite SPA, TanStack Start, native
mobile). The platform answers that question directly:
`GET /api/apps/{app_id}/agent-profile` (public API, also reachable through the Base44 MCP
`execute_api` tool) returns the app's shape, the workspace's entitlements and the exact reference
paths to read.

### Operating the pipeline (maintainers)

- The sync PR is opened by the `base44-github-actions` GitHub App, the same app the CLI and SDK
  release workflows use to dispatch here.
- Auto-merge must be enabled in the repository settings, with `Validate base44-platform skills` as
  a required check on `main`.
- `.github/CODEOWNERS` routes the generated tree and the two workflows to the owning team.
- Syncs are manual and run from Base44's side; there is no schedule in this repo.

## Questions?

- Check existing skills for examples
- Review the [Base44 SDK Documentation](https://docs.base44.com)
- Open an issue for questions or suggestions
