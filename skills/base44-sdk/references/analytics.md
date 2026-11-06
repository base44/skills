# Analytics Module

Track custom events and user activity via `base44.analytics`.

## Contents
- [Methods](#methods)
- [Examples](#examples)
- [Automatic Tracking](#automatic-tracking)
- [Privacy & Consent](#privacy--consent)
- [Best Practices](#best-practices)

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `track(params)` | `void` | Track a custom event |

## Examples

### Track Custom Event

```javascript
// Track a simple event
base44.analytics.track({
  eventName: "button_clicked"
});

// Track event with properties
base44.analytics.track({
  eventName: "purchase_completed",
  properties: {
    product_id: "prod-123",
    amount: 99.99,
    currency: "USD"
  }
});
```

### Track User Actions

```javascript
// Track page view
base44.analytics.track({
  eventName: "page_view",
  properties: {
    page: "/dashboard",
    referrer: document.referrer
  }
});

// Track feature usage
base44.analytics.track({
  eventName: "feature_used",
  properties: {
    feature: "export_data",
    format: "csv"
  }
});
```

## Automatic Tracking

The analytics module automatically tracks:
- **Initialization events**: When the app loads. This event also captures `document.referrer` and a fixed allowlist of landing-page attribution params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `gclid`, `gbraid`, `wbraid`, `gad_source`, `gad_campaignid`, `fbclid`, `msclkid`, `ttclid`, `li_fat_id`) if present in the URL. Other query params (which may contain PII) are never captured.
- **Heartbeat events**: Periodic activity signals
- **Session duration**: Time spent in the app

These internal events help measure user engagement without manual instrumentation.

## Privacy & Consent

Analytics tracking (both `track()` calls and the automatic events above) respects a per-app analytics mode that the Base44 platform injects into the page via a `<meta name="base44-analytics">` tag. This is controlled by the app owner's privacy settings, not by the JS SDK caller. The mode has three possible values:

- **`off`**: Analytics never runs. `track()` becomes a permanent no-op and no session id is created.
- **`consent`**: Tracking waits until the page's Google Consent Mode grants `analytics_storage`. Nothing is sent before that signal arrives.
- **`on`**: Tracking starts immediately but stops the moment the visitor declines consent. The decline is remembered in `localStorage` across page loads, so a fresh page load after a decline sends nothing until the consent banner re-grants access — this avoids a window where a new page tracks once before the saved choice replays.
- **No meta tag present**: Behaves as before this feature existed — tracking is always allowed.

When consent is not currently granted, `track()` silently drops the call (no error, no queued event) and any queued-but-unsent events are discarded. If consent is later granted, automatic tracking (heartbeat, session duration, initialization) restarts; if consent is withdrawn mid-session, the pending event queue is cleared and the stored analytics session id is removed from `localStorage`.

This consent handling is entirely automatic — there is no public method on `AnalyticsModule` to read or change the consent state. The only thing a developer can control from SDK configuration is whether analytics runs at all for a client, via `createClient({ analytics: { enabled: false } })`, which disables analytics unconditionally (no session id, no heartbeats, `track()` is a no-op).

## Best Practices

1. **Use descriptive event names**: `order_completed` instead of `click`
2. **Include relevant properties**: Add context that helps analyze the event
3. **Be consistent**: Use the same event names and property keys across your app
4. **Don't track sensitive data**: Avoid PII in event properties

```javascript
// Good: Descriptive with relevant properties
base44.analytics.track({
  eventName: "subscription_started",
  properties: {
    plan: "pro",
    billing_cycle: "annual"
  }
});

// Avoid: Vague event name, no context
base44.analytics.track({
  eventName: "click"
});
```

## Type Definitions

```typescript
/** Properties that can be attached to a tracked event. */
type TrackEventProperties = {
  [key: string]: string | number | boolean | null | undefined;
};

/** Parameters for the track() method. */
interface TrackEventParams {
  /** The name of the event to track. */
  eventName: string;
  /** Optional properties to attach to the event. */
  properties?: TrackEventProperties;
}

/** The analytics module interface. */
interface AnalyticsModule {
  /** Track a custom event with optional properties. */
  track(params: TrackEventParams): void;
}
```
