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

## Notes

- Logs appear in the Analytics page of your app dashboard
- App logs track page-level and feature-level activity
- Use `analytics.track()` for custom events with properties, `appLogs.logUserInApp()` for simple page/feature tracking

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
}
```
