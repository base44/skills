# Functions Module

Invoke custom backend functions via `base44.functions`.

## Contents
- [Method](#method)
- [Invoking Functions](#invoking-functions) (Frontend, File Upload, Service Role, REST API)
- [Writing Backend Functions](#writing-backend-functions) (Basic, Service Role, Secrets, Errors)
- [Setup Requirements](#setup-requirements)
- [Authentication Modes](#authentication-modes)

## Methods

### `invoke`

```javascript
base44.functions.invoke(functionName, data?): Promise<AxiosResponse>
```

Sends a POST request to a custom backend function deployed to the app. The function receives `data` as named parameters and returns the result. For streaming responses, non-POST methods, or raw response access, use `fetch()` instead.

- `functionName`: Name of the backend function
- `data`: Optional object of parameters (sent as JSON, or multipart if contains File objects)
- **Returns the RAW axios response** — the JSON your function returned lives on **`.data`**, not on the top-level object. The resolved value is `{ data, status, headers, … }`.
- **Throws on a non-2xx response.** The error body is at `err.response.data`.

```javascript
try {
  // ⚠️ invoke() returns the RAW axios response, so the JSON your function
  //    returned lives on `.data` — NOT on the top-level object.
  const res = await base44.functions.invoke("process-order", { orderId });
  const result = res.data;        // ✅  e.g. res.data.success
  // const result = res;          // ❌  this is { data, status, headers, … }
} catch (err) {
  // invoke() THROWS on a non-2xx response; the error body is at err.response.data.
  console.error(err.response?.data);
}
```

### `fetch`

```javascript
base44.functions.fetch(path, init?): Promise<Response>
```

Low-level method that performs a direct HTTP request to a backend function path and returns the native `Response` object. Use when you need low-level control that `invoke()` doesn't provide, such as streaming responses (SSE, chunked text, NDJSON), custom HTTP methods (PUT, PATCH, DELETE), or raw response access (status codes, headers, binary bodies).

- `path`: Function path. Leading slash is optional — `/chat` and `chat` are equivalent (e.g., `/streaming_demo` or `/my-function/endpoint`)
- `init`: Optional native fetch options (`RequestInit`)
- Returns: Native `Response` object

## Invoking Functions

### From Frontend

```javascript
const res = await base44.functions.invoke("processOrder", {
  orderId: "order-123",
  action: "ship"
});

// invoke() resolves to the raw axios response — read your function's JSON off .data
const result = res.data;
console.log(result);
```

### Streaming Response (using fetch)

```javascript
// Use fetch() for streaming responses (SSE, chunked text, etc.)
const response = await base44.functions.fetch("/stream-data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "Tell me a story" })
});

// Read as a stream
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

### Custom HTTP Methods (using fetch)

```javascript
// PUT, PATCH, DELETE, or other methods
const response = await base44.functions.fetch("/my-resource/123", {
  method: "DELETE"
});
console.log(response.status); // 204
```

### With File Upload

```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

// Automatically uses multipart/form-data when File objects present
const res = await base44.functions.invoke("uploadDocument", {
  file: file,
  category: "invoices"
});
const result = res.data; // function's JSON is on .data
```

### With Service Role (Backend)

```javascript
// Inside another backend function
const res = await base44.asServiceRole.functions.invoke("adminTask", {
  userId: "user-123"
});
const result = res.data; // function's JSON is on .data
```

### Via REST API (curl)

Functions can be called via HTTP POST to your app domain:

```bash
curl -X POST "https://<app-domain>/functions/<function-name>" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## Writing Backend Functions

Backend functions are HTTP handlers. Each one must `export default` an async function that takes a `Request` and returns a `Response`.

### Function Directory Structure

A backend function is a folder under `base44/functions/` with an `entry.ts` or `entry.js` file:

```
base44/
  functions/
    process-order/
      entry.ts
```

The function name is the path from `base44/functions/` to the folder containing `entry.ts`. For example, `base44/functions/process-order/entry.ts` deploys as `process-order`, and `base44/functions/orders/process/entry.ts` deploys as `orders/process`.

For complete setup and deployment instructions, see [functions-create.md](../../base44-cli/references/functions-create.md) in base44-cli.

### Basic Structure

```javascript
// base44/functions/process-order/entry.ts
import { createClientFromRequest } from "npm:@base44/sdk";

export default async function (req) {
  // Get authenticated client from request
  const base44 = createClientFromRequest(req);

  // Parse input
  const { orderId, action } = await req.json();

  // Your logic here
  const order = await base44.entities.Orders.get(orderId);

  // Return response
  return Response.json({
    success: true,
    order: order
  });
}
```

### With Service Role Access

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";

export default async function (req) {
  const base44 = createClientFromRequest(req);

  // Check user is authenticated
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role for admin operations
  const allOrders = await base44.asServiceRole.entities.Orders.list();

  return Response.json({ orders: allOrders });
}
```

### Using Secrets

Read secrets with `secrets.get()` from the `base44:runtime` module. `BASE44_APP_ID` is pre-populated; configure the rest in app settings.

```javascript
import { secrets } from "base44:runtime";

export default async function (req) {
  // Read a secret (configured in app settings)
  const apiKey = secrets.get("STRIPE_API_KEY");

  const response = await fetch("https://api.stripe.com/v1/charges", {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });

  return Response.json(await response.json());
}
```

### Post-Response Work

To finish work after the response is sent, hand the promise to `waitUntil()` from `base44:runtime`:

```javascript
import { waitUntil } from "base44:runtime";

export default async function (req) {
  waitUntil(fetch("https://hooks.example.com/ping", { method: "POST" }));
  return Response.json({ ok: true });
}
```

### Error Handling

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { orderId } = await req.json();

    const order = await base44.entities.Orders.get(orderId);
    if (!order) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return Response.json({ order });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## Setup Requirements

1. Enable Backend Functions in app settings (requires appropriate plan)
2. Create function files in `base44/functions/`
3. Configure secrets via app dashboard for API keys

## Authentication Modes

This module is available on the client in all authentication modes:

| Mode | Context | Permissions |
|------|---------|-------------|
| Anonymous | `base44.functions.invoke()` (no logged-in user) | Runs with no authentication |
| User | `base44.functions.invoke()` (logged-in user) | Runs under the calling user's permissions |
| Service Role | `base44.asServiceRole.functions.invoke()` | Admin-level access, for backend code that needs elevated permissions |

Inside the function, use `createClientFromRequest(req)` to get a client that inherits the caller's auth context.

## Type Definitions

**How to get typed function names:** The Base44 CLI can generate an augmentation of `FunctionNameRegistry` from your project. For how to run it, use the **base44-cli** skill.

```typescript
/**
 * Registry of function names.
 * Augment this interface to enable autocomplete for function names.
 * Typically populated by the Base44 CLI type generator.
 */
interface FunctionNameRegistry {}

/**
 * Function name type - uses registry keys if augmented, otherwise string.
 */
type FunctionName = keyof FunctionNameRegistry extends never ? string : keyof FunctionNameRegistry;

/**
 * Options for functions.fetch(). Uses native fetch options directly.
 */
type FunctionsFetchInit = RequestInit;

/**
 * Functions module for invoking custom backend functions.
 *
 * Available with a client in all authentication modes:
 * - Anonymous or User authentication (`base44.functions`): runs with the current user's permissions (or no auth, if anonymous).
 * - Service role authentication (`base44.asServiceRole.functions`): runs with elevated, admin-level permissions.
 */
interface FunctionsModule {
  /**
   * Invokes a custom backend function by name.
   *
   * Sends a POST request to a custom backend function deployed to the app.
   * The function receives the provided data as named parameters and returns
   * the result. If any parameter is a `File` object, the request will automatically be
   * sent as `multipart/form-data`. Otherwise, it will be sent as JSON.
   *
   * For streaming responses, non-POST methods, or raw response access, use `fetch()` instead.
   *
   * @param functionName - The name of the function to invoke.
   * @param data - An object containing named parameters for the function.
   * @returns Promise resolving to the function's response. The `data` property contains
   *          the data returned by the function, if there is any.
   *          (Note: in the current SDK implementation, this resolves to the raw axios
   *          response — see the `invoke()` section above.)
   */
  invoke(functionName: FunctionName, data?: Record<string, any>): Promise<any>;

  /**
   * Performs a direct HTTP request to a backend function path and returns the native `Response`.
   *
   * Use `fetch()` when you need low-level control that `invoke()` doesn't provide, such as:
   * - Streaming responses, like SSE, chunked text, or NDJSON
   * - Custom HTTP methods, like PUT, PATCH, or DELETE
   * - Raw response access, including status codes, headers, and binary bodies
   *
   * @param path - Function path. Leading slash is optional, so `/chat` and `chat` are
   *               equivalent. For example, `/streaming_demo` or `reports/export`.
   * @param init - Optional `RequestInit` options such as `method`, `headers`, `body`, and
   *               `signal`. Auth headers are added automatically.
   * @returns Promise resolving to a native `Response`.
   */
  fetch(path: string, init?: FunctionsFetchInit): Promise<Response>;
}
```
