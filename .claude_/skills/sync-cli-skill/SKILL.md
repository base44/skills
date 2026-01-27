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

### Step 3: Read CHANGELOG for Context

Before diving into the source code, check for a CHANGELOG.md (or CHANGELOG, HISTORY.md, RELEASES.md) in the CLI source folder:

1. **Look for changelog files** in the root directory
2. **Read recent entries** to understand what changed in recent versions
3. **Note any mentions of**:
   - New commands or subcommands
   - Changed/removed options or flags
   - Renamed arguments
   - Changed default values
   - Breaking changes

This provides valuable context for what to look for when comparing source with documentation.

### Step 4: Discover CLI Commands

Scan the CLI source folder to find all available commands. Look for:

1. **Command files** in directories like:
   - `src/commands/`
   - `commands/`
   - `lib/commands/`

2. **For each command, extract:**
   - Command name and aliases
   - Description/help text
   - **Positional arguments** (e.g., `<name>`, `<path>`) - look for `.argument()` or `.arguments()` calls
   - **Command syntax** showing positional args (e.g., `create <name> [options]`)
   - Available options and flags
   - Usage examples (if present in source)
   - Subcommands (e.g., `entities push`, `site deploy`)

3. **Parse command definitions** from:
   - Commander.js/yargs/oclif style command definitions
   - Help strings and descriptions
   - Option configurations

### Step 5: Read Existing Skill

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

### Step 6: Compare and Identify Changes

Compare discovered CLI commands with existing skill documentation:

#### Command-Level Changes
1. **New commands**: Commands in source but not in skill references
2. **Removed commands**: Commands in skill but not in source (verify before removing)
3. **Changed command descriptions**: Commands with updated help text or descriptions

#### Positional Argument Changes (CRITICAL - check first)
4. **New positional arguments**: Arguments added to command syntax (e.g., `cli <name>`)
5. **Removed positional arguments**: Positional arguments that no longer exist
6. **Option became positional**: An option was removed and its value became a positional argument (e.g., `cli -n my-app` → `cli my-app`)
7. **Positional became option**: A positional argument was converted to an option

#### Option/Flag Changes (CRITICAL - check carefully)
8. **New options**: New flags or parameters added to existing commands
9. **Removed options**: Options that existed in docs but are no longer in source
10. **Changed option descriptions**: Existing options with modified help text
11. **Changed option defaults**: Options with different default values
12. **Changed option types**: Options that changed type (e.g., string to boolean)
13. **Changed required status**: Options that became required or optional
14. **Changed option aliases**: Short flags that were added, removed, or changed (e.g., `-f` to `-F`)

#### How to Detect Argument and Option Changes

For each command, create a detailed comparison showing BOTH positional arguments AND options from source and docs:

```
Command: create

=== POSITIONAL ARGUMENTS ===
| Argument | In Source? | In Docs? | Status |
|----------|------------|----------|--------|
| <name>   | ✓          | ✗        | NEW - was previously -n option |

Source syntax: cli create <name> [options]
Documented syntax: cli create -n <name> [options]

BREAKING CHANGE: -n option removed, name is now a positional argument
  Before: cli create -n my-app --template basic
  After:  cli create my-app --template basic

=== OPTIONS ===
| Option | In Source? | In Docs? | Status |
|--------|------------|----------|--------|
| -n, --name | ✗ | ✓ | REMOVED - became positional arg |
| --force | ✓ | ✓ | Changed (description) |
| --verbose | ✓ | ✗ | NEW - add to docs |

Source options:
  --force (-f): Force deployment [boolean, default: false]
  --verbose (-v): Enable verbose output [boolean, default: false]

Documented options:
  -n, --name <name>: App name [string, required] (REMOVED - now positional!)
  --force (-f): Force deploy without confirmation [boolean, default: false]

Changes detected:
  - <name>: NEW positional argument (replaced -n option)
  - -n/--name: REMOVED option (became positional argument)
  - --force: description changed
  - --verbose: NEW option (in source, missing from docs)
```

#### Detecting Removed Options and Changed Arguments (IMPORTANT)

To find removed options and argument changes, you MUST:
1. **Extract command syntax from source** - Look for `.argument()`, `.arguments()`, or positional args in usage strings
2. **Compare syntax patterns** - Check if the documented syntax `cli -n <name>` matches source syntax `cli <name>`
3. **List ALL options currently documented** in each reference file
4. **Check if EACH documented option still exists in source** - Any documented option NOT found in source = REMOVED
5. **Check if removed options became positional args** - If an option like `-n <name>` is removed but `<name>` appears as a positional argument, document this as a syntax change

Don't just look for new options - actively verify each existing documented option still exists and check for option-to-positional conversions!

Create a summary of changes to show the user before applying.

### Step 7: Fetch External Documentation (Optional)

If a documentation URL was provided:

1. Fetch the documentation page
2. Extract relevant command documentation
3. Use this to supplement information from source code
4. Cross-reference for accuracy

### Step 8: Update Skill Files

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

### Step 9: Present Summary

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

### Options Added
- `deploy --verbose`: new option for verbose output
- `create --template`: new option for project template

### Options Removed (VERIFY BEFORE DELETING)
- `deploy --legacy`: no longer in source code
- `create --no-git`: deprecated and removed

### Options Changed
- `deploy --force`: description changed
- `deploy --env`: now required (was optional)
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
| Removed args not detected | List ALL documented options first, then verify EACH exists in source - don't just scan for new ones |
| Option became positional | Compare documented syntax with source - look for `.argument()` calls and check if removed options' values are now positional args (e.g., `-n <name>` → `<name>`) |
| Positional args not detected | Look for `.argument('<name>')`, `.arguments()`, or usage strings showing `command <arg>` patterns in source |
