# base44 entities push

Push local entity definitions to Base44.

## Syntax

```bash
npm run base44 entities push
# or
yarn base44 entities push
# or
pnpm base44 entities push
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Reads entity configuration from your local project config
2. Validates that entities exist in your configuration
3. Displays the count of entities to be pushed
4. Uploads entities to the Base44 backend
5. Reports the results: created, updated, and deleted entities

## Prerequisites

- Must be run from a Base44 project directory
- Project must have entity definitions in the configuration

## Output

```bash
$ npm run base44 entities push

Found 3 entities to push
Pushing entities to Base44...

Created: User, Post
Updated: Comment
Deleted: OldEntity

✓ Entities pushed successfully
```

## Entity Synchronization

The push operation synchronizes your local entity schema with Base44:

- **Created**: New entities that didn't exist in Base44
- **Updated**: Existing entities with modified schema or configuration
- **Deleted**: Entities that were removed from your local configuration

## Error Handling

If no entities are found in your project configuration:
```bash
$ npm run base44 entities push
Error: No entities found in project configuration
```

## Use Cases

- After defining new entities in your project
- When modifying existing entity schemas
- To sync entity changes before deploying
- As part of your development workflow when data models change

## Notes

- This command syncs the entity schema/structure, not the actual data
- Changes are applied to your Base44 project immediately
- Make sure to test entity changes in a development environment first
- Entity definitions are typically in your project's Base44 configuration file

## Recommended: Add Script to package.json

For convenience, add this to your `package.json`:

```json
{
  "scripts": {
    "base44:push": "base44 entities push"
  }
}
```

Then run:
```bash
npm run base44:push
```
