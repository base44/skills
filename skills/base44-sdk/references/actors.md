# Actors Module

Connect to realtime server rooms via `base44.actors`.

An **actor** is a stateful server room over WebSockets. There is one live instance per room id, every client connected to that id shares it, and the actor is authoritative — clients send inputs, the actor validates and broadcasts the result.

## Contents
- [Methods](#methods)
- [Connecting](#connecting) (React, vanilla, reconnects)
- [Instance Ids](#instance-ids)
- [Authentication](#authentication)
- [Writing an Actor](#writing-an-actor)
- [When to Use an Actor](#when-to-use-an-actor)
- [Type Definitions](#type-definitions)

## Methods

### `base44.actors.<ActorName>(instanceId)`

```javascript
base44.actors.ChatRoom(instanceId): ActorRef
```

- `<ActorName>`: the deployed actor's name — a property on `base44.actors`, **not** a string argument
- `instanceId`: the room id. Everyone who passes the same id shares one server instance
- Returns an `ActorRef` — a handle, not yet a connection

### `connect`

```javascript
actorRef.connect(options?): Connection
```

- `options.id` (optional): the connection id, which becomes the actor's `conn.id`. Supply a stable value so a reconnect reuses the same server-side identity; omit for an auto-generated one
- Returns a `Connection` synchronously — messages you send are buffered until the socket opens
- **Idempotent**: calling `connect()` again on the same ref returns the same connection

### `Connection.subscribe`

```javascript
connection.subscribe(callback): ActorSubscription
```

- `callback(data)`: called for every message the actor sends to this client
- Multiple listeners are allowed; returns `{ unsubscribe() }` which removes only that listener

### `Connection.send`

```javascript
connection.send(data): void
```

Sends a JSON message to the actor (arrives as `msg` in its `handleMessage`).

### `Connection.close`

```javascript
connection.close(): void
```

Tears down the socket, the heartbeat, and all listeners.

### `Connection.id`

The connection id the actor sees as `conn.id`.

## Connecting

### From React

```javascript
import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

function Board({ roomId }) {
  const [items, setItems] = useState([]);
  const roomRef = useRef(null);

  useEffect(() => {
    // Persist the conn id per tab so a page RELOAD reclaims the same seat.
    // A fresh id on every render would leak a seat per refresh.
    let connId = sessionStorage.getItem("connId");
    if (!connId) {
      connId = crypto.randomUUID();
      sessionStorage.setItem("connId", connId);
    }

    const room = base44.actors.BoardRoom(roomId).connect({ id: connId });
    roomRef.current = room;

    const sub = room.subscribe((msg) => {
      if (msg.type === "state") setItems(msg.items);
      else if (msg.type === "item") setItems((prev) => [...prev, msg.item]);
      // drop unknown types
    });

    return () => {
      sub.unsubscribe();
      room.close();
      roomRef.current = null;
    };
  }, [roomId]);

  const addItem = (text) =>
    roomRef.current?.send({ type: "upsert_item", id: crypto.randomUUID(), text });

  return <ItemList items={items} onAdd={addItem} />;
}
```

Send **operations, not outcomes**, and throttle high-frequency input (cursor moves ~20–30/s max) — never send once per render or animation frame.

**Always connect inside `useEffect` with a cleanup** — a bare `connect()` in the component body opens a socket per render.

### Vanilla

```javascript
const room = base44.actors.ChatRoom("lobby").connect();
const sub = room.subscribe((msg) => console.log(msg));

room.send({ type: "message", text: "hi" });

// later
sub.unsubscribe();
room.close();
```

### Reconnects

Reconnection, heartbeats, and half-open detection are handled by the SDK — you do not write retry logic. What you *do* control is identity: pass a stable `options.id` so the actor recognizes a returning client and can hand back its seat, role, or score. A reconnect replaces the stale socket holding that id without firing the actor's `handleClose`, which is what makes the seat reclaimable.

Persist that id in **`sessionStorage`** (per tab), not `localStorage` — two *live* connections cannot share an id, so a second tab reusing it is refused.

**React Native:** the same API applies, but there is no `sessionStorage` — keep the connection id in module scope or state. A fresh launch mints a new identity.

`base44.cleanup()` closes every live room, so a forgotten `close()` cannot leak a heartbeat timer.

## Instance Ids

The instance id is what separates one room from another.

- Printable ASCII, 1–256 characters, **no `/`**
- Use a meaningful id when the room is public or discoverable (e.g. a `Room` entity's record id)
- **Private rooms:** there is no room-level auth — the id *is* the admission control. Mint it with `crypto.randomUUID()`, keep it out of any readable list, and share it only as an invite link or code

## Authentication

The signed-in user's existing access token rides the connection automatically; nothing to mint or pass. Anonymous (logged-out) connections are allowed when the app permits them, and a login or logout is picked up on the next reconnect.

`conn.id` on the server is chosen by the client, so it identifies a *connection*, not a person. It is the right key for seats and reconnects and the wrong key for anything that must be attributed to a user — do those writes through a backend function.

## Writing an Actor

Actors live in `base44/actors/<Name>/entry.ts` and default-export a class extending `Actor`:

```javascript
// base44/actors/ChatRoom/entry.ts
import { Actor } from "base44:runtime/actors";

export default class ChatRoom extends Actor {
  async handleStart() {
    this.history = (await this.storage.get("history")) ?? [];
  }

  handleConnect(conn) {
    conn.send({ type: "history", messages: this.history });   // just this client
    this.broadcast({ type: "joined", id: conn.id });          // the whole room
  }

  async handleMessage(conn, msg) {
    if (msg?.type !== "message" || typeof msg.text !== "string") return;
    const entry = { from: conn.id, text: msg.text.slice(0, 2000) };
    this.history = [...this.history, entry].slice(-100);
    await this.storage.put("history", this.history);          // survives hibernation
    this.broadcast({ type: "message", ...entry });
  }

  handleClose(conn) {
    this.broadcast({ type: "left", id: conn.id });
  }
}
```

Key rules: instance fields are lost when the room hibernates (persist in `this.storage`, rehydrate in `handleStart`), `this.broadcast()` is for room-wide state while `conn.send()` is for one client, and `this.client` is an **anonymous** Base44 client for server-side reads/calls.

For the complete authoring contract — naming, lifecycle handlers, storage and hibernation, scheduled wakes, rooms and discovery, deployment — see [actors-create.md](../../base44-cli/references/actors-create.md) in base44-cli.

## When to Use an Actor

| Reach for `actors` | Reach for something else |
|--------------------|--------------------------|
| Multiplayer sessions, collaborative boards/docs | Live list of records → `base44.entities.Thing.subscribe()` |
| Presence, live cursors, typing indicators | Single-user state → `entities` |
| In-room chat, live auctions, shared timers | Request/response or background work → `functions.invoke()` |

## Type Definitions

**How to get typed actor names:** the Base44 CLI generates an augmentation of `ActorNameRegistry` from your project (`base44 types generate`). For how to run it, use the **base44-cli** skill.

**Message types** are hand-authored in `ActorRegistry`, so the actor and the client share one source of truth:

```typescript
declare module "@base44/sdk" {
  interface ActorRegistry {
    ChatRoom: {
      toClient:
        | { type: "history"; messages: { from: string; text: string }[] }
        | { type: "message"; from: string; text: string }
        | { type: "joined" | "left"; id: string };
      toServer: { type: "message"; text: string };
    };
  }
}
```

With that in place, `subscribe` callbacks and `send` payloads are typed:

```typescript
const room = base44.actors.ChatRoom("lobby").connect();
room.subscribe((msg) => { /* msg is the toClient union */ });
room.send({ type: "message", text: "hi" });   // checked against toServer
```

Type the actor class off the same registry so the two cannot drift:

```typescript
import { Actor } from "base44:runtime/actors";
import type { ActorRegistry } from "@base44/sdk";

type Reg = ActorRegistry["ChatRoom"];

export default class ChatRoom extends Actor<Reg["toServer"], Reg["toClient"]> { /* … */ }
```

`base44:runtime/actors` is a virtual module resolved at deploy time, so add an ambient declaration for your editor (e.g. `base44/.types/runtime.d.ts`):

```typescript
declare module "base44:runtime/actors" {
  export { Actor, type Conn } from "@base44/sdk";
}
```

### Interfaces

```typescript
/**
 * Registry of actor names.
 * Auto-populated by `base44 types generate`. Do not edit by hand.
 */
interface ActorNameRegistry {}

/**
 * Registry of actor message types.
 * Augment this interface to type subscribe callbacks and send payloads.
 */
interface ActorRegistry {}

/** Options for ActorRef.connect(). */
interface ActorConnectOptions {
  /** The connection id — becomes the actor's `conn.id`. Omit for an auto-generated one. */
  id?: string;
}

/** Handle for one listener registered via Connection.subscribe(). */
interface ActorSubscription {
  /** Remove this listener; other listeners and the socket stay live. */
  unsubscribe(): void;
}

/** A live connection to an actor instance. */
interface Connection<N extends string = string> {
  /** The connection id (the value the actor sees as `conn.id`). */
  readonly id: string;
  /** Register a message listener. Multiple are allowed. */
  subscribe(callback: (data: ToClientFor<N>) => void): ActorSubscription;
  /** Send a message. Buffered by the socket until it is open. */
  send(data: ToServerFor<N>): void;
  /** Tear down the socket, heartbeat, and all listeners. */
  close(): void;
}

/** A handle to one actor instance — `base44.actors.MyActor(id)`. */
interface ActorRef<N extends string = string> {
  /** Open the WebSocket and return the Connection. Idempotent. */
  connect(options?: ActorConnectOptions): Connection<N>;
}

/** Client for a single named actor — call it with an instance id. */
interface ActorClient<N extends string = string> {
  (instanceId: string): ActorRef<N>;
}
```

Server-side types (`Actor`, `Conn`, `Storage`) come from the actor base class:

```typescript
interface Conn<Send = unknown> {
  /** Unique per-connection id (one per socket/tab). */
  id: string;
  send(data: Send): void;
  reject(code: number, reason: string): void;
}

interface Storage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<boolean>;
  /** Wipe the room's entire persisted storage. */
  deleteAll(): Promise<void>;
}

abstract class Actor<Incoming = unknown, Outgoing = unknown> {
  abstract handleConnect(conn: Conn<Outgoing>): void | Promise<void>;
  abstract handleMessage(conn: Conn<Outgoing>, msg: Incoming): void | Promise<void>;
  abstract handleClose(conn: Conn<Outgoing>): void | Promise<void>;
  abstract handleTick(): void | Promise<void>;
  handleStart(): void | Promise<void>;
  protected handleWake(key: string): void | Promise<void>;
  protected schedule(key: string, at: number | Date): Promise<void>;
  protected cancelSchedule(key: string): Promise<void>;
  protected broadcast(data: Outgoing): void;
  protected getConnections(): Conn<Outgoing>[];
  protected get instanceId(): string;
  protected get storage(): Storage;
  /** Anonymous Base44 client scoped to this actor — RLS-gated, production data. */
  protected get client(): Base44Client;
}
```

`handleTick` is an abstract member, so a **TypeScript** actor has to declare it to compile — `handleTick() {}` is all it needs. Plain-JavaScript actors can omit it.

## Notes

- `base44.actors.<Name>(id)` returns a handle; you must call `.connect()` to get a `Connection`
- `subscribe`, `send`, and `close` live on the **`Connection`**, not on the ref
- Messages are JSON in both directions; `type` values beginning with `__` are reserved by the platform
- Actors are frontend-facing: the client connects from the browser, and the actor itself *is* the backend half
- Actors do not run under `base44 dev` — verify against a deployed actor
