---
name: sync-cli-skill
description: Synchronize the base44-cli skill with the latest CLI source code from the Base44 CLI repository
disable-model-invocation: true
---

# Sync CLI Skill

Synchronize the `skills/base44-cli/` skill with the latest CLI source code from the Base44 CLI repository.

## Usage

When activated, this command will ask for:
1. **CLI source folder path** (required) - The local path to the Base44 CLI source code
2. **Documentation URL** (optional) - URL to fetch additional documentation

## Steps

### Step 1: Gather Input

Ask the user for the required inputs using the AskQuestion tool if available, otherwise ask conversationally:

**Required:**
- CLI source folder path (e.g., `~/projects/base44-cli` or `/Users/me/base44-cli`)

**Optional:**
- Documentation URL (e.g., `https://docs.base44.com/cli`)

If the user provided these in the initial prompt, use those values.

### Step 2: Validate Source Folder

1. Check that the provided path exists and contains CLI source code
2. Look for these key indicators:
   - `package.json` with CLI-related content
   - `src/` or `commands/` directory
   - Command implementation files (e.g., `login.ts`, `create.ts`, `deploy.ts`)

If validation fails, ask the user to verify the path.

### Step 3: Discover CLI Commands

Scan the CLI source folder to find all available commands. Look for:

1. **Command files** in directories like:
   - `src/commands/`
   - `commands/`
   - `lib/commands/`

2. **For each command, extract:**
   - Command name and aliases
   - Description/help text
   - Available options and flags
   - Usage examples (if present in source)
   - Subcommands (e.g., `entities push`, `site deploy`)

3. **Parse command definitions** from:
   - Commander.js/yargs/oclif style command definitions
   - Help strings and descriptions
   - Option configurations

### Step 4: Read Existing Skill

Read the current skill files to understand what needs updating:

```
skills/base44-cli/
├── SKILL.md
└── references/
    ├── auth-login.md
    ├── auth-logout.md
    ├── auth-whoami.md
    ├── create.md
    ├── deploy.md
    ├── entities-create.md
    ├── entities-push.md
    ├── functions-create.md
    ├── functions-deploy.md
    ├── rls-examples.md
    └── site-deploy.md
```

### Step 5: Compare and Identify Changes

Compare discovered CLI commands with existing skill documentation:

#### Command-Level Changes
1. **New commands**: Commands in source but not in skill references
2. **Removed commands**: Commands in skill but not in source (verify before removing)
3. **Changed command descriptions**: Commands with updated help text or descriptions

#### Option/Argument-Level Changes (CRITICAL - check carefully)
4. **New options**: New flags or parameters added to existing commands
5. **Removed options**: Options that existed in docs but are no longer in source
6. **Changed option descriptions**: Existing options with modified help text
7. **Changed option defaults**: Options with different default values
8. **Changed option types**: Options that changed type (e.g., string to boolean)
9. **Changed required status**: Options that became required or optional
10. **Changed option aliases**: Short flags that were added, removed, or changed (e.g., `-f` to `-F`)

#### How to Detect Option Changes

For each command, create a detailed comparison:

```
Command: deploy
Source options:
  --force (-f): Force deployment [boolean, default: false]
  --env <name>: Target environment [string, required]

Documented options:
  --force (-f): Force deploy without confirmation [boolean, default: false]  
  --env <name>: Environment name [string, optional]

Changes detected:
  - --force: description changed ("Force deployment" vs "Force deploy without confirmation")
  - --env: required status changed (required vs optional)
```

Create a summary of changes to show the user before applying.

### Step 6: Fetch External Documentation (Optional)

If a documentation URL was provided:

1. Fetch the documentation page
2. Extract relevant command documentation
3. Use this to supplement information from source code
4. Cross-reference for accuracy

### Step 7: Update Skill Files

For each change identified:

#### Update Reference Files

For each command, update or create `references/{command-name}.md`:

```markdown
# base44 {command}

{Description from source}

## Syntax

```bash
npx base44 {command} [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `-o, --option <value>` | {description} | {yes/no} |

## Examples

```bash
{example usage from source or docs}
```

## Notes

{Any important behavioral notes}
```

#### Update SKILL.md

1. Update the **Available Commands** tables if commands changed
2. Update **Quick Start** if workflow changed
3. Update **Common Workflows** sections
4. Keep the existing structure and formatting
5. Do NOT change the frontmatter description unless explicitly asked

### Step 8: Present Summary

After updates, present a summary to the user:

```
## Sync Summary

### Files Updated
- references/new-command.md (created)
- references/deploy.md (updated options)
- SKILL.md (updated command table)

### Commands Added/Removed
- Added: `base44 new-command`
- Removed: `base44 legacy-cmd` (deprecated)

### Option Changes
- `deploy --force`: description changed
- `deploy --env`: now required (was optional)
- `create --template`: added new option
- `create --legacy`: removed deprecated option
- `entities push --dry-run`: default changed from true to false

### Description Updates
- `deploy`: command description updated

### Manual Review Recommended
- [List any changes that need verification]
```

## Important Notes

- **Preserve existing content**: Don't remove detailed explanations, examples, or warnings unless they're outdated
- **Keep formatting consistent**: Match the existing style of SKILL.md and reference files
- **Maintain progressive disclosure**: Keep detailed docs in references, summaries in SKILL.md
- **Flag uncertainties**: If source code is unclear, flag it for manual review
- **Respect RLS/FLS docs**: The `entities-create.md` and `rls-examples.md` contain hand-written security documentation - update carefully

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't find command files | Try searching for `.command(` or `program.command` patterns |
| Options not detected | Look for `.option(` patterns in commander.js files |
| Missing descriptions | Check for `description:` properties or `.description(` calls |
| Subcommand structure | Commands like `entities push` may be in `entities/push.ts` |
| Changed args not detected | Compare each option property: name, alias, description, default, required, type |
| Default values unclear | Look for second argument in `.option()` or `default:` property |
| Required status unclear | Check for `.requiredOption()` or `required: true` in option config |
