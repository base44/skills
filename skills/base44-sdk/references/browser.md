# Browser Module

Remote browser automation via `base44.asServiceRole.browser`.

> **Backend only**: This module requires service role access and can only be used in Base44-hosted backend functions.

This module creates remote browser sessions that you control over the Chrome DevTools Protocol (CDP) with a client library such as Playwright or Puppeteer. Base44 doesn't store browser state, so each session is independent. End each session when you're done with it — otherwise it keeps running until its timeout expires.

## Methods

| Method | Signature | Description |
|--------|-----------|--------------|
| `getSession(options?)` | `Promise<BrowserSession>` | Create a new remote browser session and return its connection details |
| `endSession(sessionId)` | `Promise<void>` | End a session created in a different request |

Each call to `getSession()` creates a fresh session — calls aren't retried automatically, and repeating a failed call doesn't resume a previous session. Session creation is rate limited per app.

Call `end()` on the object returned by `getSession()` to end the session from the same request. Use `endSession(sessionId)` instead when the session needs to be ended from a *different* request than the one that created it (e.g., a cleanup job). Ending a session that has already ended succeeds, so it's safe to call more than once; it fails with the `browser_session_not_found` error code if the ID wasn't issued to your app.

`connectionUrl` is a signed CDP WebSocket URL — treat the complete URL as a credential. Don't log it or send it to the frontend.

## Examples

### Open a page in a remote browser with Playwright

```javascript
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

### Turn off recordings and diagnostic logs

```javascript
const session = await base44.asServiceRole.browser.getSession({
  captureDebugArtifacts: false,
});
```

### Request a custom session timeout

```javascript
const session = await base44.asServiceRole.browser.getSession({
  sessionTimeoutSeconds: 600,
});
```

### End a session whose ID was saved by an earlier request

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { sessionId } = await req.json();
  await base44.asServiceRole.browser.endSession(sessionId);

  return new Response(null, { status: 204 });
});
```

## Use Cases

- Backend web scraping and data extraction that requires a real browser
- Automated UI testing or visual regression checks run from backend functions
- Generating PDFs or screenshots of pages your app doesn't control directly
- Driving third-party sites that have no API, from a backend job

## Important Notes

- **Service role only**: `base44.asServiceRole.browser` requires service role authentication; it's not available in frontend or regular user-mode clients.
- **No stored state**: Base44 doesn't persist browser state between sessions — each `getSession()` call starts fresh.
- **Debug artifacts**: Recordings and diagnostic logs (on by default) stay with the remote browser provider and can't be retrieved through the SDK.
- **Timeouts**: Base44 clamps `sessionTimeoutSeconds` to a configured minimum/maximum; omit it to use the default.
- **Connection scope**: `connectionScope` is `'browser'` (the socket controls the whole browser) or `'page'` (the socket controls a single page), depending on what the provider issues.

## Type Definitions

```typescript
/** Options for getSession(). */
interface BrowserSessionOptions {
  /** Whether to capture browser recordings and diagnostic logs for the session. Defaults to true. */
  captureDebugArtifacts?: boolean;
  /** Maximum lifetime of the session, in whole seconds; clamped to Base44's allowed range. Defaults to Base44's configured timeout when omitted. */
  sessionTimeoutSeconds?: number;
}

/** A remote browser session returned by getSession(). */
interface BrowserSession {
  /** Opaque session identifier issued to your app; pass to endSession() to end it from a different request. */
  sessionId: string;
  /** Signed CDP WebSocket URL for connecting to the browser. Treat as a credential. */
  connectionUrl: string;
  /** Scope of the CDP connection: 'browser' (whole browser) or 'page' (single page). */
  connectionScope: "browser" | "page";
  /** ISO 8601 timestamp when the connection URL expires. Omitted when the provider doesn't expose it. */
  connectionExpiresAt?: string;
  /** ISO 8601 timestamp when the browser session expires. Omitted when the provider doesn't expose it. */
  sessionExpiresAt?: string;
  /** Ends the session. Equivalent to calling endSession() with this session's ID. */
  end: () => Promise<void>;
}

/** Browser module for running browser automation from your backend. Service role only. */
interface BrowserModule {
  /**
   * Creates a new remote browser session and returns its connection details.
   * @param options - Optional session settings.
   */
  getSession(options?: BrowserSessionOptions): Promise<BrowserSession>;

  /**
   * Ends a browser session created by your app, e.g. from a different request than the one that created it.
   * @param sessionId - The sessionId returned by getSession(), unchanged.
   */
  endSession(sessionId: string): Promise<void>;
}
```
