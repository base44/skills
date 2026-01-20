# Review Skills

Review and analyze a skill against best practices for length, intent scope, and trigger patterns.

## Prerequisites

Before analyzing, read these resources to understand skill writing principles:
1. `.cursor/references/skill-creator/SKILL.md` - Core principles, anatomy, and progressive disclosure
2. `.cursor/references/skill-creator/references/workflows.md` - Workflow patterns (if relevant)
3. `.cursor/references/skill-creator/references/output-patterns.md` - Output patterns (if relevant)

### Reference Examples from Anthropic (REQUIRED)

You MUST read reference skills from Anthropic's repository before analyzing. This is essential for calibrating your review.

1. **Ensure cache is available**: Check if `.cursor/cache/anthropics-skills/` exists. If not (or if stale), run:
   ```bash
   python scripts/download_anthropics_skills.py
   ```

2. **Read at least 3 reference skills**: Before analyzing, read these SKILL.md files from `.cursor/cache/anthropics-skills/skills/`:

   **Always read these high-quality examples:**
   - `pdf/SKILL.md` - Well-structured workflow skill with clear triggers
   - `docx/SKILL.md` - Good example of document processing patterns
   - `skill-creator/SKILL.md` - Meta-skill showing best practices

   **Then read 1-2 skills similar to the one being reviewed:**
   - For workflow-based skills: `xlsx/SKILL.md`, `pptx/SKILL.md`
   - For tool/API skills: `mcp-builder/SKILL.md`
   - For creative/design skills: `brand-guidelines/SKILL.md`, `frontend-design/SKILL.md`
   - For testing skills: `webapp-testing/SKILL.md`

3. **Note patterns to compare**: As you read, note:
   - How descriptions are structured (trigger patterns)
   - Length and depth of SKILL.md body
   - How references are organized and used
   - Balance between brevity and completeness

## Steps

### Step 1: Receive the Skill to Review

The user must provide a skill folder/path to review. If not provided, prompt:
> "Please provide the path to the skill folder you want to review (e.g., `.claude/skills/my-skill/`)"

### Step 2: Read the Skill

Read the complete skill structure:
- `SKILL.md` (frontmatter and body)
- Any files in `references/`, `scripts/`, `assets/` directories

**IMPORTANT**: Only analyze the skill provided by the user.

### Step 3: Analyze the Skill

Perform analysis in three areas, comparing against the reference skills you read from Anthropic's repository:

#### A. Length Analysis

Using the progressive disclosure guidelines from skill-creator, evaluate:
- Word count in `description` field
- Line/word count in SKILL.md body
- Number and size of reference files
- Duplication between SKILL.md and reference files

#### B. Intent Scope Analysis

Evaluate:
- All intents the skill serves
- Whether skill handles multiple distinct use cases
- Whether splitting would improve triggering accuracy
- Trade-offs: context efficiency vs. maintenance overhead

Questions to answer:
- Does this skill try to do too much?
- Are there distinct user intents that deserve separate skills?

#### C. Trigger Analysis (CRITICAL)

The `description` field is the primary triggering mechanism. Evaluate it for three types of triggers:

| Trigger Type | What to Check |
|--------------|---------------|
| **User INTENT** | Does it describe what the user wants to do? (e.g., "deploy", "create", "edit") |
| **TECHNICAL context** | Does it mention code patterns, file types, imports? (e.g., "base44.entities.*", ".jsonc files") |
| **Project stack** | Does it mention frameworks, tools, file structures? (e.g., "Vite", "Next.js", "base44/") |

Check:
- Does description cover both intent-based AND technical triggers?
- Is it specific enough to trigger correctly, but broad enough to not miss cases?
- Are there gaps where the skill might not trigger when it should?
- Does it clearly distinguish from similar skills?

Good trigger pattern example:
```
ACTIVATE when (1) INTENT - user wants to [action]; (2) TECHNICAL - code contains [patterns], uses [APIs]; (3) CONTEXT - project has [structure/files]
```

### Step 4: Provide Recommendations

Summarize findings with actionable recommendations for:
1. **Length**: What should be trimmed or split?
2. **Intent Scope**: Should it be split or combined?
3. **Triggers**: How can the description be improved?

## Output Format

```
## Skill Review: [Skill Name]

### Reference Skills Compared
- [List the 3-5 Anthropic skills you read before this review]

### Summary
[1-2 sentence overview]

### Length Analysis
- Description: X words
- SKILL.md body: X lines / X words
- Reference files: X files
- **Assessment**: [Pass/Needs attention]
- **Recommendations**: [Specific suggestions]

### Intent Scope Analysis
- Intents served: [List]
- **Assessment**: [Focused/Broad/Too broad]
- **Recommendations**: [Split suggestions if applicable]

### Trigger Analysis
- Intent coverage: [Yes/Partial/No]
- Technical coverage: [Yes/Partial/No]
- Stack coverage: [Yes/Partial/No]
- **Assessment**: [Strong/Adequate/Weak]
- **Recommendations**: [Specific description improvements]

### Overall Recommendations
1. [Priority 1 action item]
2. [Priority 2 action item]
3. [Priority 3 action item]
```
