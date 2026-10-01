# REST API (Direct Entity Access)

Entity data can be accessed directly via HTTP, useful for data migrations, backfills, debugging, or when the SDK isn't available.

## Base URL

```
https://app.base44.com/api/apps/{appId}/entities/{EntityName}
```

## Authentication

Include the API key in the request header:

```bash
-H "api_key: YOUR_API_KEY"
```

API keys can be found in project secrets (`npx base44 secrets list`).

## Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `sort` | Sort field (prefix `-` for descending) | `sort=-created_date` |
| `limit` | Max records to return (max 5000) | `limit=100` |
| `skip` | Offset for pagination | `skip=100` |

## Examples

### List records
```bash
curl -s "https://app.base44.com/api/apps/{appId}/entities/Task?sort=-created_date&limit=10" \
  -H "api_key: YOUR_API_KEY"
```

### Paginate through all records
```bash
# Page 1
curl -s "...?limit=1000&skip=0" -H "api_key: ..."
# Page 2
curl -s "...?limit=1000&skip=1000" -H "api_key: ..."
```

### Create a record
```bash
curl -s -X POST "https://app.base44.com/api/apps/{appId}/entities/Task" \
  -H "api_key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "New task", "status": "pending"}'
```

### Update a record
```bash
curl -s -X PUT "https://app.base44.com/api/apps/{appId}/entities/Task/{recordId}" \
  -H "api_key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

## When to Use

- **Data migrations and backfills** — processing large datasets from local scripts
- **Debugging** — inspecting entity data when the dashboard isn't enough
- **CI/CD pipelines** — seeding test data or validating deployments
- **Backend function limitations** — when SDK calls in Deno hit response size limits
