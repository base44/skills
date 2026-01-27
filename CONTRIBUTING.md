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

## Questions?

- Check existing skills for examples
- Review the [Base44 SDK Documentation](https://docs.base44.com)
- Open an issue for questions or suggestions
