# Voice Module

Live voice conversations between your app's users and an AI agent, via `base44.asServiceRole.voice`.

> **Backend only, beta.** This module is only available on a client in service role authentication mode — `base44.asServiceRole.voice`. It cannot be used from the browser. The module is in beta and may change.

## Contents
- [Overview](#overview)
- [Methods](#methods)
- [Notes](#notes)
- [Type Definitions](#type-definitions)

---

## Overview

The voice agent can use your app's tools through one of the app's MCP profiles, acting as the current user. Audio flows directly between the browser and the voice model over [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) — your backend only creates and ends the session, it never touches the audio stream.

A session takes three steps:

1. The browser creates a WebRTC SDP offer (`RTCPeerConnection.createOffer()`) and sends it to one of your backend functions.
2. The backend function calls `createSession()` with the offer and your voice settings, and returns the SDP answer to the browser.
3. The browser applies the answer with `RTCPeerConnection.setRemoteDescription()`, and the conversation starts.

Keep the instructions, models, and MCP profile ID in the backend function — only the SDP offer should come from the browser.

If the current request has no authenticated user, the app's tools run as a guest, which only works in apps that allow anonymous access.

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `createSession(options)` | `Promise<VoiceSession>` | Creates a live voice session and returns the SDP answer for the browser |
| `endSession(sessionId)` | `Promise<void>` | Ends a voice session created by your app |

### `createSession(options)`

**Parameters** (`VoiceSessionOptions`):

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `sdp` | `string` | The browser's WebRTC SDP offer. A new offer is needed for every session. | Yes |
| `mcpProfileId` | `string` | ID of the app's MCP profile whose tools the voice agent can use. | Yes |
| `voiceInstructions` | `string` | How the voice model speaks with the current user (persona, tone, turn-taking). | Yes |
| `agentInstructions` | `string` | How the agent behind the voice uses the app's tools to answer and act. | Yes |
| `voiceModel` | `string` | AI Gateway model ID for the model that talks with the current user. Defaults to Base44's default voice model. | No |
| `agentModel` | `string` | AI Gateway model ID for the model behind the voice that calls the app's tools (e.g. `'gpt_6_luna'`). Defaults to Base44's default agent model. | No |
| `voice` | `string` | Built-in voice to speak with (e.g. `'cedar'`). Fixed for the whole session. Defaults to the provider's default voice. | No |
| `initialMessages` | `VoiceSessionMessage[]` | Text conversation placed before the call starts, oldest first — gives the voice agent context, or continues a conversation started in text. Each message has `role` (`'developer'` \| `'user'` \| `'assistant'`) and `text`. | No |

There's no app ID parameter — the service-role client already identifies the app, so the route isn't app-scoped.

**Returns:** `Promise<VoiceSession>` (see [Type Definitions](#type-definitions)). Each call uses credits from the workspace that owns the app. The session ends on its own when idle or at its maximum duration; call `endSession()` to end it sooner.

**Throws:** a `Base44Error` with one of these `code` values:
- `insufficient_credits` — the workspace is out of credits.
- `authentication_required` — the app requires a current user, and the request had none.
- `unsupported_voice_model` — the voice model isn't supported.
- `unsupported_agent_model` — the agent model isn't supported.
- `voice_settings_rejected` — the voice provider rejected the settings (e.g. instructions too long).
- `invalid_request` — a value in `options` is invalid.
- `rate_limited` — too many sessions created in a short time.
- `voice_capacity_exceeded` — voice capacity is temporarily unavailable.
- `voice_connection_failed` — the voice provider couldn't be reached or rejected the request.

**Example:**

```javascript
// Backend function that creates a voice session for the current user
import { createClientFromRequest } from "npm:@base44/sdk";

const VOICE_PROFILE_ID = "6a1f0c2b9d8e7f6a5b4c3d2e";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  // Only the SDP offer comes from the browser.
  const { sdp } = await req.json();

  const session = await base44.asServiceRole.voice.createSession({
    sdp,
    mcpProfileId: VOICE_PROFILE_ID,
    voiceInstructions: "You are the shop assistant. Speak briefly and let the person interrupt.",
    agentInstructions: "Use the app tools to look up orders. Report only what the tools return.",
  });

  return Response.json({ sessionId: session.sessionId, sdp: session.sdp });
});
```

```javascript
// Pick the models and voice, and give the agent context about the current page
const session = await base44.asServiceRole.voice.createSession({
  sdp,
  mcpProfileId: VOICE_PROFILE_ID,
  voiceModel: "gpt_live_1",
  agentModel: "gpt_6_luna",
  voiceInstructions: "You are the shop assistant.",
  agentInstructions: "Use the app tools to look up orders.",
  voice: "cedar",
  initialMessages: [
    { role: "developer", text: "The person is viewing order 1042 on the checkout page." },
  ],
});
```

### `endSession(sessionId)`

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `sessionId` | `string` | The `sessionId` returned by `createSession()`. | Yes |

**Returns:** `Promise<void>` that resolves when Base44 accepts the request; the session closes in the background. Ending a session that already ended succeeds, so it's safe to call more than once.

**Throws:** a `Base44Error` with one of these `code` values:
- `voice_session_not_found` — the session ID wasn't issued to your app.
- `voice_connection_failed` — Base44 couldn't reach its background processing (it closes the session directly where possible; retrying is safe).

The SDK also validates `sessionId` locally before making the request: a missing or non-string value throws a plain `Error("Session ID is required and must be a string")`, not a `Base44Error`.

**Example:**

```javascript
// End a session from a later request, using the ID sent in the request body
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { sessionId } = await req.json();
  await base44.asServiceRole.voice.endSession(sessionId);

  return new Response(null, { status: 204 });
});
```

---

## Notes

- **Service role only, backend only.** `voice` exists solely on `base44.asServiceRole.voice`; there is no frontend-accessible `base44.voice`. Call it from a Base44-hosted backend function.
- **Beta.** The shape of this module may change.
- Audio never passes through your backend — only the SDP offer/answer handshake does. The browser and the voice model exchange audio directly over WebRTC after your backend returns the SDP answer.
- `environment` on the returned session tells you whether the voice agent is using the published (`'live'`) or draft (`'draft'`) MCP profile. `'draft'` is served when the app's owner or an editor starts the session from the app editor preview, so voice works before the app is published.
- This module intentionally documents no fixed list of voice/model names, instruction length limits, session durations, or prices — Base44 validates those server-side so a backend rule change doesn't require an SDK release. Handle the `Base44Error` codes above instead of hardcoding assumed limits.

---

## Type Definitions

```typescript
/** A text message placed in the conversation before the call starts. */
interface VoiceSessionMessage {
  /**
   * Who wrote the message:
   * - 'developer': Context for the voice agent, such as what the current user is looking at.
   * - 'user': An earlier turn by the current user.
   * - 'assistant': An earlier turn by the voice agent.
   */
  role: string;
  /** The message text. */
  text: string;
}

/** Options for createSession(). */
interface VoiceSessionOptions {
  /** The browser's WebRTC SDP offer. A new offer is needed for every session. */
  sdp: string;
  /** ID of the app's MCP profile whose tools the voice agent can use. */
  mcpProfileId: string;
  /** Model that talks with the current user, as an AI Gateway model ID. Defaults to Base44's default voice model. */
  voiceModel?: string;
  /** Model behind the voice that calls the app's tools, as an AI Gateway model ID, e.g. 'gpt_6_luna'. Defaults to Base44's default agent model. */
  agentModel?: string;
  /** How the voice model speaks with the current user: persona, tone, turn-taking. */
  voiceInstructions: string;
  /** How the agent behind the voice uses the app's tools to answer and act. */
  agentInstructions: string;
  /** Built-in voice to speak with, e.g. 'cedar'. Fixed for the whole session. Defaults to the provider's default voice. */
  voice?: string;
  /** Text conversation placed before the call starts, oldest first. */
  initialMessages?: VoiceSessionMessage[];
}

/** A live voice session returned by createSession(). */
interface VoiceSession {
  /** Opaque session identifier issued to your app. Pass unchanged to endSession(). */
  sessionId: string;
  /** The SDP answer. Return it to the browser and apply with RTCPeerConnection.setRemoteDescription(). */
  sdp: string;
  /** ISO 8601 timestamp when the session ends at the latest. */
  expiresAt: string;
  /**
   * Where the voice agent's tools come from:
   * - 'live': the published MCP profile.
   * - 'draft': the current draft of the MCP profile (app editor preview).
   */
  environment: "live" | "draft";
}

/** Voice module for live voice conversations (service role only). */
interface VoiceModule {
  /** Creates a live voice session and returns the SDP answer for the browser. */
  createSession(options: VoiceSessionOptions): Promise<VoiceSession>;

  /** Ends a voice session created by your app. Safe to call more than once. */
  endSession(sessionId: string): Promise<void>;
}
```
