# base44 entities records

Manage entity records (data) via the CLI. Supports listing, getting, creating, updating, and deleting individual records.

> **Note:** These commands operate on record **data**, not entity schemas. To manage entity schemas, use `base44 entities push`.

## Commands

### List Records

```bash
npx base44 entities records list <entity-name> [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --filter <json>` | JSON query filter | - |
| `-s, --sort <field>` | Sort field (prefix with `-` for descending) | - |
| `-l, --limit <n>` | Max records to return | `50` |
| `--skip <n>` | Number of records to skip | - |
| `--fields <fields>` | Comma-separated fields to return | - |

**Example:**

```bash
# List all Tasks
npx base44 entities records list Task

# List with filter and sort
npx base44 entities records list Task --filter '{"status": "todo"}' --sort "-created_date" --limit 10

# List specific fields only
npx base44 entities records list Task --fields "title,status"
```

**Output:** JSON array of records printed to stdout.

### Get Record

```bash
npx base44 entities records get <entity-name> <record-id>
```

**Example:**

```bash
npx base44 entities records get Task 64f1a2b3c4d5e6f7a8b9c0d1
```

**Output:** JSON object of the record printed to stdout.

### Create Record

```bash
npx base44 entities records create <entity-name> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-d, --data <json>` | JSON object with record data |
| `--file <path>` | Read record data from a JSON/JSONC file |

One of `--data` or `--file` is required.

**Example:**

```bash
# Inline JSON
npx base44 entities records create Task --data '{"title": "Buy groceries", "status": "todo", "priority": 3}'

# From file
npx base44 entities records create Task --file new-task.json
```

**Output:** JSON object of the created record (includes generated `id`, `created_date`, etc.).

### Update Record

```bash
npx base44 entities records update <entity-name> <record-id> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-d, --data <json>` | JSON object with fields to update |
| `--file <path>` | Read update data from a JSON/JSONC file |

One of `--data` or `--file` is required. Only the specified fields are updated (partial update).

**Example:**

```bash
# Update status and priority
npx base44 entities records update Task 64f1a2b3c4d5e6f7a8b9c0d1 --data '{"status": "done", "priority": 1}'
```

**Output:** JSON object of the updated record.

### Delete Record

```bash
npx base44 entities records delete <entity-name> <record-id> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompt |

**Example:**

```bash
# With confirmation prompt
npx base44 entities records delete Task 64f1a2b3c4d5e6f7a8b9c0d1

# Skip confirmation
npx base44 entities records delete Task 64f1a2b3c4d5e6f7a8b9c0d1 -y
```

## Authentication

**Required**: Yes. All record commands require authentication. If not authenticated, you'll be prompted to login first.

## Prerequisites

- Must be run from a Base44 project directory (has `base44/.app.jsonc`)
- The entity must already exist (pushed via `base44 entities push`)
- The app must be a Backend Platform app (created via CLI)

## Entity Name Format

Use the entity schema name in PascalCase as it appears in your entity definition file:

- Entity file `base44/entities/task.jsonc` with `"name": "Task"` → use `Task`
- Entity file `base44/entities/team-member.jsonc` with `"name": "TeamMember"` → use `TeamMember`

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Entity schema not found | Entity hasn't been pushed | Run `npx base44 entities push` first |
| Not authenticated | No valid session | Run `npx base44 login` |
| Invalid JSON in --data | Malformed JSON string | Check JSON syntax, use single quotes around the value |
| Record not found (404) | Record ID doesn't exist | Verify the record ID with `records list` |

## Notes

- The `User` entity cannot be managed through these commands. Use the Base44 dashboard for user management.
- All output is JSON, suitable for piping to `jq` or other tools.
- Delete performs a soft delete (records can be restored via the dashboard).
- Records are always accessed with admin/builder privileges (bypasses RLS).
