# Publishing to the Official Claude Code Marketplace

This guide walks through submitting the base44 skills plugin to the official Anthropic marketplace.

## Prerequisites

1. Ensure `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` are valid and up to date.
2. All changes are merged to `main`.
3. Validate the plugin locally:
   ```bash
   claude plugin validate .
   ```

## Steps

### 1. Fork the official marketplace repo

Fork [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) on GitHub.

### 2. Add the base44 entry

Open the `marketplace.json` file in your fork and add the following entry to the `plugins` array:

```json
{
  "name": "base44",
  "description": "Build and deploy Base44 full-stack apps with CLI project management and JavaScript/TypeScript SDK development skills.",
  "category": "development",
  "source": {
    "source": "url",
    "url": "https://github.com/base44/skills.git"
  },
  "homepage": "https://docs.base44.com",
  "tags": ["community-managed"]
}
```

### 3. Submit a pull request

- Create a PR from your fork to `anthropics/claude-plugins-official`.
- Title: `Add base44 skills plugin`
- In the PR description, include:
  - A brief overview of what the plugin provides (CLI + SDK skills for Base44 development).
  - Link to the source repo: https://github.com/base44/skills
  - Link to documentation: https://docs.base44.com
  - Confirmation that the plugin passes `claude plugin validate .`.

### 4. Review process

After submitting, the Anthropic team will review the PR. Expect them to verify:

- The plugin validates successfully.
- Skills are well-documented and functional.
- The plugin doesn't conflict with existing marketplace entries.
- License and metadata are properly set.

Once approved and merged, users can discover and install the plugin directly from the Claude Code marketplace.
