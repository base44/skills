<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 actors: Realtime actors (mobile apps)

<realtime_actors>
Realtime shared state runs on Actors: stateful server rooms over WebSockets (Durable Objects). One live instance per room id — every client connected to that id shares it. Use an actor whenever users interact live in one shared session: collaborative drawing and whiteboards, shared docs, presence and live cursors, chat rooms, live auctions, multiplayer games. Not for single-user state, not for a page that just lists records live (entity realtime subscriptions already push record changes), not for async flows (entities + functions are enough). The actor is AUTHORITATIVE: clients send inputs/operations, the actor validates, applies, and broadcasts — never trust client-computed outcomes, and never advance authoritative state client-side.

<actor_contract>
Write `base44/actors/{Name}/entry.ts` — the FOLDER names the actor (it is what `base44.actors.{Name}` resolves); export the class as the DEFAULT export. One actor per directory. Author plain JS like a backend function — no type annotations; the file is `.ts` only for the entry contract. Writing the file deploys it; there is no request-style test for an actor (WebSocket) — verify in the preview.

```js
// base44/actors/BoardRoom/entry.ts   (plain JS)
import { Actor } from 'base44:runtime/actors';   // the ONLY import that resolves the Actor base

const MAX_USERS = 32;   // a room is single-threaded — admit only what one instance can serve

export default class BoardRoom extends Actor {
  // Keyed by conn.id (the SDK reuses it on reconnect, so entries are reclaimable) —
  // but conn.id is CLIENT-HELD and must NEVER appear in broadcasts: broadcast state
  // is keyed by the server-assigned seat instead.
  users = new Map();     // conn.id -> { seat, cursor }
  nextSeat = 1;
  items = new Map();     // the shared, persisted room state

  async handleStart() {
    // Runs on ANY wake (deploy restart, idle, hibernation) — rehydrate, then
    // reconcile: a hibernation wake keeps sockets ATTACHED without re-running
    // handleConnect, so a still-live id must keep its seat, not lose it.
    const saved = await this.storage.get('items');
    if (saved) this.items = new Map(saved);
    const seats = await this.storage.get('seats');
    if (seats) this.users = new Map(seats);
    const live = new Set(this.getConnections().map((c) => c.id));
    for (const id of this.users.keys()) if (!live.has(id)) this.users.delete(id);
    this.nextSeat = Math.max(0, ...[...this.users.values()].map((u) => u.seat)) + 1;
  }
  async handleConnect(conn) {
    if (!this.users.has(conn.id) && this.users.size >= MAX_USERS) {
      conn.reject(4001, 'room full');   // reject closes the socket but NOT this handler —
      return;                           // return immediately
    }
    // Reconnects are ROUTINE (blips, reloads, redeploys): a returning id reclaims
    // its entry — never demote it or mint a new seat.
    if (!this.users.has(conn.id)) {
      this.users.set(conn.id, { seat: this.nextSeat++, cursor: null });
      await this.saveSeats();   // at seat milestones, never per cursor move
    }
    conn.send({ type: 'you', seat: this.users.get(conn.id).seat });
    conn.send({ type: 'state', items: [...this.items.values()] });   // late joiners get full state
    this.broadcastPresence();
  }
  async handleMessage(conn, msg) {
    // Runtime-validate EVERYTHING: the wire payload is attacker-controlled and
    // msg can even be null. Accept operations, never authoritative state.
    if (typeof msg !== 'object' || msg === null) return;
    const u = this.users.get(conn.id);
    if (!u) return;
    if (msg.type === 'cursor') {
      u.cursor = [Number(msg.x) || 0, Number(msg.y) || 0];
      this.broadcastPresence();
    } else if (msg.type === 'upsert_item' && typeof msg.id === 'string' && msg.id.length <= 64) {
      const item = { id: msg.id, text: String(msg.text ?? '').slice(0, 2000) };
      this.items.set(item.id, item);
      await this.storage.put('items', [...this.items.entries()]);   // persist on change — never on every pointer move
      this.broadcast({ type: 'item', item });
    }
  }
  async handleClose(conn) {
    this.users.delete(conn.id);
    await this.saveSeats();
    this.broadcastPresence();
  }
  saveSeats() { return this.storage.put('seats', [...this.users.entries()]); }
  broadcastPresence() {
    // PROJECT an explicit public shape — never spread whole server objects into a
    // broadcast (they grow per-user secrets later).
    this.broadcast({
      type: 'presence',
      users: [...this.users.values()].map((u) => ({ seat: u.seat, cursor: u.cursor })),
    });
  }
}
```
</actor_contract>

<actor_rules>
- Handlers: `handleConnect` / `handleMessage` / `handleClose`, plus optional `handleStart` (any wake) and `handleWake(key)` (scheduled wakes). Never override `onStart` or `onAlarm` — platform plumbing.
- State: instance fields reset when the room idles out — a room hibernates after ~10s of quiet EVEN with clients connected; `this.storage` survives. Persist state you can't lose when it changes and rehydrate it in `handleStart()`; never write high-frequency churn (every pointer move, every keystroke) to storage. A hibernation wake keeps sockets ATTACHED and does NOT re-run `handleConnect`, so reconcile the rehydrated state against `this.getConnections()` — skip that and every connected client stays unrecognized until it reconnects. (`static options = { hibernate: false }` only makes the room non-hibernatable, NOT resident: it is still evicted after ~1-2 minutes idle, so storage is still the only durable answer. Rarely needed.)
- `conn.id` is the per-connection identity. The SDK reuses it across auto-reconnects, and a persisted `connect({ id })` (see the client) makes reloads reclaim it too — key seats/roles by it and let a returning id RECLAIM its entry with its role and work intact. When a drop shouldn't discard that work, give the id a short grace before wiping its state; when the LAST client leaves mid-session, schedule the cleanup as a wake and cancel it on reconnect. conn.id is client-held: fine for seats and reconnects, NEVER attribution — that is `conn.identity`, platform-verified: `{ type: 'authenticated', userId }` or `{ type: 'anonymous', anonymousId }` (a visitor, not a user).
- Scheduled wakes: `this.schedule(key, atEpochMs)` persists a named wake; `handleWake(key)` runs at/after it EVEN IF THE ROOM IS EMPTY AND ASLEEP. `cancelSchedule(key)` cancels; re-scheduling a key overwrites. Coarse (±seconds) and fires at most once — use for deadline timers (auction close, session expiry), delayed cleanup of abandoned rooms, absolute-time events; in-session countdowns stay timestamp-driven.
- `this.broadcast(...)` is for ROOM-wide state; events about ONE client (your assigned color, your validation error, your private draft) go `conn.send(...)` — broadcasting them leaks private state and makes every client react. Messages are JSON both ways; `type` values starting with `__` are platform-reserved.
- `this.client` is a ready-made `@base44/sdk` client on every actor (`await this.client.functions.invoke('name', input)` — there is no `functions.name()` form, and the returned value sits on `.data`; `await this.client.entities.Thing.filter(...)`) acting as the app's ANONYMOUS role, pinned to the actor's own deploy. `this.client.asServiceRole` (`entities`, `functions`, `integrations`) is the admin-level client, as in a backend function: use it for work the ROOM owns and has validated — persisting its durable result, maintaining its registry row, reading private config — never to do what a client asked without validating it, and never loosen RLS to the anonymous role instead. Neither client is a signed-in user: attribute service-role records with an explicit field from `conn.identity.userId` (authenticated identities only). The first privileged call after a wake pays a token exchange — keep it on persist paths, not per message.
- Durable results (the finished drawing, a chat transcript, an exported document): the actor broadcasts the authoritative result, writes it to `this.storage`, and persists it to entities via `asServiceRole`, keyed by the room instance id and IDEMPOTENT (check for the existing record before creating; readers treat the earliest record per key as canonical) — delivery and wakes are at-least-once. Re-`conn.send` it to (re)connecting clients: shells cannot read actor storage. The shell writes only records the USER owns, never the room's canonical result.
- Actor auth is automatic: the first actor deploy generates an `ACTOR_TOKEN_SECRET` app secret (one per app, shared by all actors) that seeds the connection-token keys. Never ask the user for it or set it yourself; overwriting it rotates the keys and redeploys the actors; it is not readable from function or actor env.
- Rooms and discovery: one room = one session (a drawing board, a chat channel, a document) — never funnel everyone into a single global room. For browsable rooms keep a registry ENTITY (e.g. Room: status, user_count) whose record id IS the actor instance id; the registry is advertising, the actor is truth — admission is decided in `handleConnect`, never from the row. List rooms by subscribing to the entity FIRST, then fetching and reconciling by id; filter to recently-updated rows (crashed rooms leave stale ones). PRIVATE rooms: there is no room-level auth yet — the instance id is the only admission control, so mint it with `crypto.randomUUID()` (record ids are enumerable ObjectIds), never list it in a readable registry, and share it only as an invite link/code.
</actor_rules>

<actor_client>
```js
// React shell. Connect in useEffect WITH cleanup — a bare connect in the component
// body leaks a socket per render.
import { base44 } from '@/api/base44Client';

useEffect(() => {
  // Persist the conn id per tab so a page RELOAD reclaims the same seat; a fresh
  // per-render id would leak seats on every refresh.
  let connId = sessionStorage.getItem('connId');
  if (!connId) { connId = crypto.randomUUID(); sessionStorage.setItem('connId', connId); }
  const room = base44.actors.BoardRoom(roomId).connect({ id: connId });   // the handle IS the connection
  const sub = room.subscribe((msg) => {
    // Branch on msg.type into React state; drop unknown types.
  });
  return () => { sub.unsubscribe(); room.close(); };
}, [roomId]);
// Send operations on change (room.send({ type: 'upsert_item', ... })); throttle
// high-frequency input like cursors or brush strokes (~20-30/s max), never per render.
```
Reconnection, heartbeats, and auth are handled by the SDK.
React Native: the same SDK API applies; there is no `sessionStorage` — keep the conn id in module scope or state (a fresh launch mints a new identity).
</actor_client>
</realtime_actors>
