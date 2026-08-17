# Creating Actors

Actors are Base44's realtime primitive: **stateful server rooms over WebSockets**. There is exactly one live instance per room id, and every client connected to that id shares it. The actor is authoritative — clients send inputs/operations, the actor validates them, applies them to its own state, and broadcasts the result.

Actors are defined locally in your project and deployed to the Base44 backend, just like backend functions.

## When to Use an Actor

| Use an actor | Use something else |
|--------------|--------------------|
| Multiplayer sessions where users interact live | Single-user state → entities |
| Collaborative boards, docs, whiteboards | A page that just lists records live → `base44.entities.Thing.subscribe()` |
| Presence and live cursors | Async or request/response work → backend functions |
| In-room chat | Scheduled/background jobs → backend functions + automations |
| Live auctions, countdowns, shared timers | Anything that must attribute writes to a signed-in user → backend functions |

## Actor Directory

All actor definitions live in the `base44/actors/` folder. An actor is a folder containing an `entry.ts` file:

```
my-app/
  base44/
    actors/
      BoardRoom/
        entry.ts
      ChatRoom/
        entry.ts
```

## How to Create an Actor

1. Create a directory in `base44/actors/` named after the actor (PascalCase)
2. Create `entry.ts` in that directory and default-export a class extending `Actor`
3. Deploy it with `npx base44 actors deploy`

## Actor Discovery and Naming

The CLI discovers actors from `entry.ts` (or `entry.js`) files, and **the folder is the actor's identity** — the folder name becomes the actor name.

| File | Actor name |
|------|------------|
| `base44/actors/BoardRoom/entry.ts` | `BoardRoom` |
| `base44/actors/ChatRoom/entry.ts` | `ChatRoom` |

The name becomes the Durable Object class *and* the WebSocket connect handler, so it must be a plain JavaScript identifier:

**Rules:**
- Must match `[A-Za-z_][A-Za-z0-9_]*`, max 128 characters — **no `-`, `.`, `/`, or `:`**
- Must not be a JavaScript reserved word (`class`, `default`, `new`, `static`, …)
- Must be a **single folder level** — `base44/actors/games/Arena/entry.ts` is not a valid actor (unlike functions, actors cannot be nested)
- Must not collide with a backend function name
- Use **PascalCase** by convention (it reads as a class, and it is one)

| Valid | Invalid | Why |
|-------|---------|-----|
| `BoardRoom` | `board-room` | Hyphens are not valid in a JS identifier |
| `ChatRoom` | `chat.room` | Dots are not valid in a JS identifier |
| `Lobby` | `games/Arena` | Actors cannot be nested |
| `Room2` | `2Room` | Cannot start with a digit |
| `AuctionRoom` | `class` | Reserved word |

All `*.js`, `*.ts`, `*.json`, and `*.jsonc` files under the actor folder are included when deploying.

**Never name a helper `entry.ts`.** Every `entry.ts`/`entry.js` under `base44/actors/` is treated as an actor entry, at any depth — so `base44/actors/BoardRoom/lib/entry.ts` is discovered as an actor named `BoardRoom/lib` and rejected on deploy (names cannot contain `/`). Name helpers anything else.

## Entry Point File

The entry file **default-exports** a class extending `Actor`, imported from `base44:runtime/actors` — the only import that resolves the base class:

```javascript
// base44/actors/BoardRoom/entry.ts
import { Actor } from "base44:runtime/actors";

const MAX_USERS = 32;

export default class BoardRoom extends Actor {
  users = new Map();   // conn.id -> { seat, cursor }
  items = new Map();   // the shared, persisted room state
  nextSeat = 1;

  async handleStart() {
    // Runs on ANY wake (deploy, idle, hibernation). Rehydrate, then reconcile:
    // a hibernation wake keeps sockets ATTACHED without re-running handleConnect.
    this.items = new Map((await this.storage.get("items")) ?? []);
    this.users = new Map((await this.storage.get("seats")) ?? []);
    const live = new Set(this.getConnections().map((c) => c.id));
    for (const id of this.users.keys()) if (!live.has(id)) this.users.delete(id);
    this.nextSeat = Math.max(0, ...[...this.users.values()].map((u) => u.seat)) + 1;
  }

  async handleConnect(conn) {
    if (!this.users.has(conn.id) && this.users.size >= MAX_USERS) {
      conn.reject(4001, "room full");   // closes the socket but does NOT return
      return;                            // from the handler — return immediately
    }
    // Reconnects are routine (network blips, reloads, redeploys): a returning
    // id reclaims its entry — never demote it or mint a new seat.
    if (!this.users.has(conn.id)) {
      this.users.set(conn.id, { seat: this.nextSeat++, cursor: null });
      await this.saveSeats();
    }
    conn.send({ type: "you", seat: this.users.get(conn.id).seat });
    conn.send({ type: "state", items: [...this.items.values()] });   // late joiners get full state
    this.broadcastPresence();
  }

  async handleMessage(conn, msg) {
    // Validate EVERYTHING at runtime: the payload is attacker-controlled and
    // msg can even be null. Accept operations, never authoritative state.
    if (typeof msg !== "object" || msg === null) return;
    const user = this.users.get(conn.id);
    if (!user) return;

    if (msg.type === "cursor") {
      user.cursor = [Number(msg.x) || 0, Number(msg.y) || 0];
      this.broadcastPresence();
    } else if (msg.type === "upsert_item" && typeof msg.id === "string" && msg.id.length <= 64) {
      const item = { id: msg.id, text: String(msg.text ?? "").slice(0, 2000) };
      this.items.set(item.id, item);
      await this.storage.put("items", [...this.items.entries()]);   // persist on change
      this.broadcast({ type: "item", item });
    }
  }

  async handleClose(conn) {
    this.users.delete(conn.id);
    await this.saveSeats();
    this.broadcastPresence();
  }

  saveSeats() {
    return this.storage.put("seats", [...this.users.entries()]);
  }

  broadcastPresence() {
    // Project an explicit public shape — never spread whole server objects into
    // a broadcast (they grow per-user secrets later).
    this.broadcast({
      type: "presence",
      users: [...this.users.values()].map((u) => ({ seat: u.seat, cursor: u.cursor })),
    });
  }
}
```

The class name is cosmetic — the deploy re-exports your default export under the **folder** name. `export default class extends Actor { … }` works too.

### Lifecycle Handlers

| Handler | When it runs |
|---------|--------------|
| `handleConnect(conn)` | A client opened a connection to this room |
| `handleMessage(conn, msg)` | A client sent a message (parsed JSON) |
| `handleClose(conn)` | A connection closed |
| `handleStart()` | Optional. Any time the instance wakes (deploy, idle-out, hibernation) — before any connection is handled. Rehydrate state here |
| `handleWake(key)` | Optional. A timer armed with `this.schedule(key, at)` came due |

Never override `onStart` or `onAlarm` — those are platform plumbing.

### Instance API (`this.*`)

| Member | Description |
|--------|-------------|
| `this.broadcast(data)` | Send a message to every connection in the room |
| `this.getConnections()` | Array of the live connections |
| `this.storage.get(key)` | Read persisted state (`Promise<value \| undefined>`) |
| `this.storage.put(key, value)` | Persist state |
| `this.storage.delete(key)` | Delete one key (`Promise<boolean>`) |
| `this.storage.deleteAll()` | Wipe the room's storage — a later rejoin bootstraps like a brand-new room |
| `this.instanceId` | This room's instance id (the value the client connected with) |
| `this.schedule(key, at)` | Arm a one-shot wake at `at` (epoch ms or `Date`) |
| `this.cancelSchedule(key)` | Cancel a pending wake |
| `this.client` | An anonymous Base44 SDK client (see [Calling Base44](#calling-base44-from-an-actor)) |

### The Connection Object (`conn`)

| Member | Description |
|--------|-------------|
| `conn.id` | Per-connection identity, chosen by the client and reused across reconnects |
| `conn.send(data)` | Send a message to this one client |
| `conn.reject(code, reason)` | Refuse the connection (closes the socket; **`return` immediately after**) |

`conn.id` is client-held. It's the right key for seats, roles, and reconnect reclamation — it is **never** trusted attribution. Durable per-user results (leaderboards, rewards, saved documents) must go through a signed-in path outside the actor.

## State, Hibernation, and Reconnects

Instance fields (`this.users`, `this.items`, …) live only as long as the room is awake. A quiet room hibernates after ~10 seconds **even with clients still connected**; `this.storage` is what survives.

- Persist state you can't lose **when it changes**; never write high-frequency churn (every pointer move, every keystroke) to storage.
- Rehydrate in `handleStart()`, then **reconcile against `this.getConnections()`** — a hibernation wake keeps sockets attached and does **not** re-run `handleConnect`, so skipping this leaves every connected client unrecognized until it reconnects.
- Let a returning `conn.id` reclaim its entry (seat, role, score) instead of minting a new one.
- A reconnect that replaces a stale socket holding the same id closes the old one silently — `handleClose` does **not** fire for it, so the returning connection keeps its entry. Two **live** connections cannot share an id: the second is refused. That is why the client persists its connection id per tab (`sessionStorage`), never per browser.
- In sessions where a drop shouldn't instantly destroy state, give a missing id a short grace period; when the last client leaves mid-session, schedule the cleanup as a wake and cancel it if someone reconnects.

`static options = { hibernate: false }` only makes a room non-hibernatable, not resident — it is still evicted after a couple of minutes idle, so storage remains the only durable answer. It is rarely needed.

## Scheduled Wakes

```javascript
await this.schedule("close_auction", Date.now() + 60_000);
// …later
await this.cancelSchedule("close_auction");

async handleWake(key) {
  if (key === "close_auction") {
    this.broadcast({ type: "auction_closed", winner: this.highBid });
  }
}
```

- Fires **even if the room is empty and asleep**.
- One-shot and coarse (±seconds); re-scheduling the same key overwrites it.
- Good for turn/forfeit timers, delayed cleanup of abandoned rooms, and absolute-time events. In-session countdowns should stay timestamp-driven on the client.

## Broadcasting vs Per-Client Messages

- `this.broadcast(data)` — **room-wide state** everyone should see.
- `conn.send(data)` — events about **one** client (your seat, your hand, your error). Broadcasting these leaks private state and makes every client react.

Messages are JSON in both directions. `type` values beginning with `__` are reserved by the platform.

## Durable Results

When a session produces something that must outlive the room (the finished drawing, a chat transcript, an exported document):

1. The **actor** broadcasts the authoritative result *and* writes it to `this.storage`, then re-`conn.send`s it to (re)connecting clients — a frontend cannot read actor storage, so that resend is the retry path.
2. The **frontend** persists it to entities. It has the signed-in user identity; the actor does not.

Delivery is at-least-once, so the persistence step must be **idempotent**: key the record by the room's instance id and check for an existing record before creating one. Readers treat the earliest record per key as canonical.

## Calling Base44 from an Actor

Every actor has `this.client`, a ready-made `@base44/sdk` client acting as the app's **anonymous** role:

```javascript
const rows = await this.client.entities.Room.filter({ status: "open" });

const res = await this.client.functions.invoke("settle_auction", { roomId: this.instanceId });
const settled = res.data;   // invoke() returns the raw response; the JSON is on .data
```

- Entity access is RLS-gated exactly like a logged-out visitor.
- It always operates on production data.
- It **cannot** act as a signed-in user — never route a user-attributed write through it.

## Using Secrets

Secrets work the same as in backend functions:

```javascript
import { Actor } from "base44:runtime/actors";
import { secrets } from "base44:runtime";

export default class PriceRoom extends Actor {
  async handleStart() {
    this.apiKey = secrets.get("MARKET_API_KEY");
  }
}
```

`BASE44_API_URL` and `BASE44_FUNCTIONS_VERSION` are reserved — the platform injects them for `this.client`, so a secret of either name is not readable from an actor. Pick another name.

## Multi-File Actors

An actor is not limited to `entry.ts`. Any `.js`, `.ts`, `.json`, or `.jsonc` file inside the actor's folder is uploaded on deploy and can be imported with a relative path:

```
base44/
  actors/
    BoardRoom/
      entry.ts       ← import { sanitize } from "./sanitize.ts";
      sanitize.ts
      limits.json
```

**The actor's own folder is the whole upload.** `base44 actors deploy` sends exactly the files under `base44/actors/<Name>/` — unlike `functions deploy`, which also uploads the `base44/shared/` tree alongside every function. Keep the code an actor imports inside the actor's folder (copy it, or expose it through a backend function the actor calls with `this.client`).

## Rooms and Discovery

One actor instance = one session (one board, one match, one auction). Never funnel every user into a single global room.

- **Cap capacity in `handleConnect`** and `conn.reject(...)` past the limit — the actor is the only place a cap can be enforced.
- **Browsable rooms:** keep a registry **entity** (e.g. `Room` with `status`, `user_count`) whose **record id is the actor instance id**. The registry is advertising; the actor is truth. List rooms by subscribing to the entity first, then fetching and reconciling by id, and filter to recently-updated rows (crashed rooms leave stale ones behind).
- **Private rooms:** there is no room-level auth. The instance id *is* the admission control, so mint it with `crypto.randomUUID()` (record ids are enumerable), keep it out of any readable registry, and share it only as an invite link or code.
- Instance ids are printable ASCII, 1–256 characters, and may not contain `/`.

## Deploying Actors

```bash
npx base44 actors deploy
```

Actors are also deployed as part of `npx base44 deploy`. For details, see [actors-deploy.md](actors-deploy.md).

## Notes

- Actors run on the Cloudflare backend; deploying one activates it if needed.
- Actors serve only the realtime WebSocket path — **automations are not supported** on an actor. Use a backend function if you need scheduled or entity-triggered work.
- `base44 dev` does not run actors locally; verify against a deployed actor.
- Use `npm:` specifiers for npm packages (e.g. `npm:zod`), same as in backend functions.
- Connecting from the frontend is `base44.actors.<Name>(instanceId).connect()` — see the base44-sdk skill's [actors.md](../../base44-sdk/references/actors.md).

## Common Mistakes

| Wrong | Correct | Why |
|-------|---------|-----|
| `base44/functions/ChatRoom/entry.ts` with `Actor` | `base44/actors/ChatRoom/entry.ts` | Actors have exactly one home; the actor import is rejected in the functions bucket |
| `import { Actor } from "@base44/sdk"` | `import { Actor } from "base44:runtime/actors"` | Only the virtual module resolves the base class at deploy time |
| `base44/actors/chat-room/entry.ts` | `base44/actors/ChatRoom/entry.ts` | The name becomes a JS class binding — no hyphens |
| `base44/actors/games/Arena/entry.ts` | `base44/actors/Arena/entry.ts` | Actors cannot be nested |
| `export class ChatRoom extends Actor` only | `export default class ChatRoom extends Actor` | The deploy re-exports the **default** export |
| `import { ok } from "../../shared/util.ts"` | Keep the helper inside the actor folder | Only the actor's own folder is uploaded |
| Storing state only in instance fields | `this.storage.put(...)` + rehydrate in `handleStart()` | Instance fields are lost when the room hibernates |
| `this.broadcast({ type: "your_hand", cards })` | `conn.send({ type: "your_hand", cards })` | Per-client events must not be broadcast |
| Trusting `msg.score` from a client | Recompute the outcome in the actor | Clients send inputs; the actor is authoritative |
