# App Logs Module

Log user activity in your app via `base44.appLogs`.

## Contents
- [Methods](#methods)
- [Examples](#examples)
- [Use Cases](#use-cases)

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `logUserInApp(pageName)` | `Promise<void>` | Log user activity on a page |
| `fetchLogs(params?)` | `Promise<any>` | Fetch app logs with optional filter parameters |
| `getStats(params?)` | `Promise<any>` | Get app usage statistics |

## Examples

### Log User Activity

```javascript
// Log when user visits a page
await base44.appLogs.logUserInApp("dashboard");

// Log specific page visits
await base44.appLogs.logUserInApp("settings");
await base44.appLogs.logUserInApp("profile");

// Log feature usage
await base44.appLogs.logUserInApp("export-button-click");
```

The page name doesn't have to be an actual page - it can be any string you want to track.

`logUserInApp` follows the same consent/opt-out rules as `base44.analytics` (a page visit feeds App Analytics). If analytics is disabled or the visitor hasn't granted consent, the call resolves immediately as a no-op and nothing is sent to the server.

## Use Cases

### Track Page Views in React

```javascript
// Log page views on route change
useEffect(() => {
  base44.appLogs.logUserInApp(window.location.pathname);
}, [location.pathname]);
```

### Track Feature Usage

```javascript
// Log when user uses specific features
function handleExport() {
  base44.appLogs.logUserInApp("export-data");
  // ... export logic
}

function handleSettingsChange() {
  base44.appLogs.logUserInApp("settings-updated");
  // ... save settings
}
```

### Fetch Logs

```javascript
// Fetch all logs
const logs = await base44.appLogs.fetchLogs();

// Fetch logs with filters
const recentLogs = await base44.appLogs.fetchLogs({
  limit: 50,
  page: "/dashboard"
});
```

### Get Stats

```javascript
// Get usage statistics for the app
const stats = await base44.appLogs.getStats();

// Get stats with date range params
const weekStats = await base44.appLogs.getStats({
  from: "2024-01-01",
  to: "2024-01-07"
});
```

## Notes

- Logs appear in the Analytics page of your app dashboard
- App logs track page-level and feature-level activity
- Use `analytics.track()` for custom events with properties, `appLogs.logUserInApp()` for simple page/feature tracking
- `fetchLogs` and `getStats` are marked `@internal` in the SDK's type definitions - they exist on `base44.appLogs` and work as documented, but they're not part of the module's primary public-facing surface (no typed params/filters are exposed; both just pass through an arbitrary `Record<string, any>` as query params). Prefer `logUserInApp` for app code; treat `fetchLogs`/`getStats` as subject to change.

## Type Definitions

```typescript
/** App Logs module for tracking and analyzing app usage. */
interface AppLogsModule {
  /**
   * Log user activity in the app.
   * @param pageName - Name of the page or section being visited.
   * @returns Promise that resolves when the log is recorded.
   */
  logUserInApp(pageName: string): Promise<void>;

  /**
   * Fetch app logs with optional filter parameters.
   * @param params - Optional filter parameters (e.g., limit, page name, date range).
   * @returns Promise resolving to the logs data.
   */
  fetchLogs(params?: Record<string, any>): Promise<any>;

  /**
   * Get app usage statistics.
   * @param params - Optional filter parameters (e.g., date range).
   * @returns Promise resolving to the statistics data.
   */
  getStats(params?: Record<string, any>): Promise<any>;
}
```
