# Browser Module

Remote browser automation sessions, controllable over the Chrome DevTools Protocol (CDP).

- **`base44.asServiceRole.browser`** — Create and end remote browser sessions (backend/service role only).

## Contents
- [Service Role Browser (`base44.asServiceRole.browser`)](#service-role-browser-base44asservicerolebrowser)
- [Type Definitions](#type-definitions)

---

## Service Role Browser (`base44.asServiceRole.browser`)

Runs browser automation from your backend by creating a remote browser session that you drive with a CDP client library such as [Playwright](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp) or [Puppeteer](https://pptr.dev/api/puppeteer.puppeteer.connect). Base44 doesn't store browser state — each session is independent. **Backend/service role only.**

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getSession(options?)` | `Promise<BrowserSession>` | Creates a new remote browser session and returns its connection details |
| `endSession(sessionId)` | `Promise<void>` | Ends a session from a different request than the one that created it |

#### `getSession(options?)`

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options.captureDebugArtifacts` | `boolean` | Whether Base44's browser provider records the session and keeps its diagnostic logs. You can't retrieve recordings/logs through the SDK — set to `false` when the session shows sensitive data. Defaults to `true`. | No |
| `options.sessionTimeoutSeconds` | `number` | Maximum lifetime of the session, in whole seconds. The session ends when the timeout expires even if still in use. Clamped to between `60` and `900`. Defaults to `300`. | No |

**Returns:** `Promise<BrowserSession>` — see [Type Definitions](#type-definitions). `BrowserSession.end()` ends the same session.

Each call creates a fresh session and uses credits from the workspace that owns the app. Sessions are billed by the minute until they end.

**Throws:** a `Base44Error` with one of these `code` values:
- `insufficient_credits` — the workspace is out of credits.
- `rate_limited` — more than 100 sessions were created in the last minute.
- `browser_capacity_exceeded` — browser capacity is temporarily unavailable.

#### `endSession(sessionId)`

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `sessionId` | `string` | The `sessionId` returned by `getSession()`. | Yes |

**Returns:** `Promise<void>`. Ending a session that already ended succeeds, so it's safe to call more than once.

**Throws:** a `Base44Error` with `code: "browser_session_not_found"` when the session ID wasn't issued to your app.

### Examples

```javascript
// Open a page in a remote browser with Playwright
import { createClientFromRequest } from "npm:@base44/sdk";
import { chromium } from "npm:playwright-core";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const session = await base44.asServiceRole.browser.getSession();

  try {
    const browser = await chromium.connectOverCDP(session.connectionUrl);
    const page = browser.contexts()[0]?.pages()[0] ?? (await browser.newPage());
    await page.goto("https://example.com");
    const title = await page.title();
    await browser.close();

    return Response.json({ title });
  } finally {
    await session.end();
  }
});
```

```javascript
// Turn off recordings and diagnostic logs
const session = await base44.asServiceRole.browser.getSession({
  captureDebugArtifacts: false,
});

try {
  // Connect to session.connectionUrl and run your automation
} finally {
  await session.end();
}
```

```javascript
// End a session from a later request, using the ID sent in the request body
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { sessionId } = await req.json();
  await base44.asServiceRole.browser.endSession(sessionId);

  return new Response(null, { status: 204 });
});
```

---

## Important Notes

- **Backend/service role only**: `browser` is only available as `base44.asServiceRole.browser`. There's no frontend/user-mode browser access.
- **Treat `connectionUrl` as a credential**: it's a signed CDP WebSocket URL — don't log it or send it to the frontend.
- **Billing**: each session uses workspace credits and is billed by the minute until it ends; always call `end()` (or `endSession()`) when done.

---

## Type Definitions

```typescript
/** Options for getSession(). */
interface BrowserSessionOptions {
  /** Whether to record the session and keep diagnostic logs. Defaults to true. */
  captureDebugArtifacts?: boolean;
  /** Max session lifetime in seconds, clamped to 60–900. Defaults to 300. */
  sessionTimeoutSeconds?: number;
}

/** A remote browser session returned by getSession(). */
interface BrowserSession {
  /** Opaque session identifier. Pass to endSession() to end it from a different request. */
  sessionId: string;
  /** Signed CDP WebSocket URL. Treat as a credential — don't log or expose to the frontend. */
  connectionUrl: string;
  /** Scope of the CDP connection: 'browser' controls the whole browser, 'page' a single page. */
  connectionScope: "browser" | "page";
  /** ISO 8601 timestamp when the connection URL expires, if exposed by the provider. */
  connectionExpiresAt?: string;
  /** ISO 8601 timestamp when the session expires, if exposed by the provider. */
  sessionExpiresAt?: string;
  /** Ends the session. Equivalent to endSession(sessionId). */
  end: () => Promise<void>;
}

/** Browser module for running browser automation from the backend. Service role only. */
interface BrowserModule {
  getSession(options?: BrowserSessionOptions): Promise<BrowserSession>;
  endSession(sessionId: string): Promise<void>;
}
```
