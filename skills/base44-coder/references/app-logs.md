# App Logs Module

Log and fetch app usage data via `base44.appLogs`.

## Contents
- [Methods](#methods)
- [Examples](#examples) (Log Activity, Fetch Logs, Get Stats)
- [Use Cases](#use-cases)

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `logUserInApp(pageName)` | `Promise<void>` | Log user activity on a page |
| `fetchLogs(params?)` | `Promise<any>` | Fetch app usage logs |
| `getStats(params?)` | `Promise<any>` | Get app usage statistics |

## Examples

### Log User Activity

```javascript
// Log when user visits a page
await base44.appLogs.logUserInApp("dashboard");

// Log specific page visits
await base44.appLogs.logUserInApp("settings");
await base44.appLogs.logUserInApp("profile");
```

### Fetch Logs

```javascript
// Fetch all logs
const logs = await base44.appLogs.fetchLogs();

// Fetch with parameters
const filteredLogs = await base44.appLogs.fetchLogs({
  limit: 100,
  skip: 0
});
```

### Get Statistics

```javascript
// Get app usage statistics
const stats = await base44.appLogs.getStats();

// Get stats with parameters
const filteredStats = await base44.appLogs.getStats({
  start_date: "2024-01-01",
  end_date: "2024-01-31"
});
```

## Use Cases

### Track Page Views

```javascript
// In a React app, log page views on route change
useEffect(() => {
  base44.appLogs.logUserInApp(window.location.pathname);
}, [location.pathname]);
```

### Admin Dashboard

```javascript
// Display usage statistics in admin panel
async function loadDashboard() {
  const stats = await base44.appLogs.getStats();
  const recentLogs = await base44.appLogs.fetchLogs({ limit: 50 });
  
  // Display stats and logs
  console.log("App Statistics:", stats);
  console.log("Recent Activity:", recentLogs);
}
```

## Notes

- App logs are separate from analytics - they track app-level usage
- Use `analytics.track()` for custom events, `appLogs.logUserInApp()` for page-level activity
- Logs are useful for understanding user navigation patterns and app health
