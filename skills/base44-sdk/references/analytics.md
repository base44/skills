# Analytics Module

Track custom events and user activity via `base44.analytics`.

## Contents
- [Methods](#methods)
- [Examples](#examples)
- [Automatic Tracking](#automatic-tracking)
- [Consent & Opt-Out Behavior](#consent--opt-out-behavior)
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
- **Initialization events**: When the app loads. This also captures the page referrer and, if present in the URL, marketing attribution parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `gclid`, `gbraid`, `wbraid`, `gad_source`, `gad_campaignid`, `fbclid`, `msclkid`, `ttclid`, `li_fat_id`).
- **Heartbeat events**: Periodic activity signals, sent while the page is visible
- **Session duration**: Time spent in the app, measured between the page becoming visible and becoming hidden

These internal events help measure user engagement without manual instrumentation.

## Consent & Opt-Out Behavior

Tracking (both automatic and custom `track()` calls) respects the app's analytics consent setting, which the Base44 platform controls per app:

- If analytics is turned **off** for the app, `track()` is a no-op and no events are queued or sent.
- If the app requires **consent** (e.g. a cookie/consent banner), tracking is paused until the visitor grants consent through that banner, and stops again if consent is withdrawn. Events are not queued while consent is withheld.
- Otherwise, tracking proceeds as normal.

This is handled automatically by the SDK — there's nothing you need to configure from application code. If events you expect aren't appearing in the dashboard, consider whether the visitor may not have granted analytics consent.

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
