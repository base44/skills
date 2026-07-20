# Creating Functions

Base44 functions are serverless backend functions. They are defined locally in your project and deployed to the Base44 backend.

## Function Directory

All function definitions must be placed in the `base44/functions/` folder in your project. The simplest function is a folder with an `entry.ts` or `entry.js` file inside it.

Example structure:
```
my-app/
  base44/
    functions/
      process-order/
        entry.ts
      send-notification/
        entry.ts
```

## How to Create a Function

1. Create a new directory in `base44/functions/` with your function name (use kebab-case)
2. Create `entry.ts` (or `entry.js`) in that directory
3. Deploy the function using the CLI

## Function Discovery

The CLI discovers functions from `entry.ts` or `entry.js` files. A folder that contains one of those files is a function:

```
base44/
  functions/
    process-order/
      entry.ts
```

The function name is the path from the functions root to that folder. For example:

| File | Function name |
|------|---------------|
| `base44/functions/process-order/entry.ts` | `process-order` |
| `base44/functions/orders/process/entry.ts` | `orders/process` |

Rules:
- `entry.ts` or `entry.js` must be inside a named subfolder, not directly in `base44/functions/`
- all `*.js`, `*.ts`, `*.json`, and `*.jsonc` files under the function folder are included when deploying
- function paths with a dot in any path segment are ignored

## Entry Point File

Functions export a request handler using `Deno.serve()`. Use the `npm:` prefix to import npm packages.

```typescript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
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
});
```

### Request Object

The function receives a standard `Request` object:
- `req.json()` - Parse JSON body
- `req.text()` - Get raw text body
- `req.headers` - Access request headers
- `req.method` - HTTP method

### Response Object

Return using `Response.json()` for JSON responses:

```typescript
// Success response
return Response.json({ data: result });

// Error response with status code
return Response.json({ error: "Something went wrong" }, { status: 400 });

// Not found
return Response.json({ error: "Order not found" }, { status: 404 });
```

## Complete Example

### Directory Structure
```
base44/
  functions/
    process-order/
      entry.ts
```

### entry.ts
```typescript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { orderId } = await req.json();
    
    // Validate input
    if (!orderId) {
      return Response.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch and process the order
    const order = await base44.entities.Orders.get(orderId);
    if (!order) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    return Response.json({
      success: true,
      orderId: order.id,
      processedAt: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
```

## Using Service Role Access

For admin-level operations, use `asServiceRole`:

```typescript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Check user is authenticated
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Use service role for admin operations
  const allOrders = await base44.asServiceRole.entities.Orders.list();
  
  return Response.json({ orders: allOrders });
});
```

## Using Secrets

Access environment variables configured in the app dashboard:

```typescript
Deno.serve(async (req) => {
  // Access environment variables (configured in app settings)
  const apiKey = Deno.env.get("STRIPE_API_KEY");
  
  const response = await fetch("https://api.stripe.com/v1/charges", {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });
  
  return Response.json(await response.json());
});
```

## Naming Conventions

- **Directory name**: Use kebab-case (e.g., `process-order`, `send-notification`)
- **Function name**: Comes from the directory path under `base44/functions/`
  - Valid: `process-order`, `orders/process`, `send_notification`, `myFunction`
  - Invalid: `process.order`, `send.notification.v2`
- **Entry file**: Use `entry.ts` or `entry.js`

## Deploying Functions

After creating your function, deploy it to Base44:

```bash
npx base44 functions deploy
```

For more details on deploying, see [functions-deploy.md](functions-deploy.md).

## Notes

- Use `npm:` prefix for npm packages (e.g., `npm:@base44/sdk`)
- Use `createClientFromRequest(req)` to get a client that inherits the caller's auth context
- Configure secrets via app dashboard for API keys
- Make sure to handle errors gracefully and return appropriate HTTP status codes

## Multi-File Functions

A function is not limited to `entry.ts`. Any `.js`, `.ts`, `.json`, or `.jsonc` file in the function's folder is uploaded on deploy and can be imported from `entry.ts` with a relative path.

```
base44/
  functions/
    process-order/
      entry.ts       ← import { validate } from "./validate.ts";
      validate.ts    ←   import { Order } from "./types.ts";
      types.ts
      config.json
```

**Rules:**
- Import files in the same folder with `./`, including the extension (e.g. `./validate.ts`).
- The entire function folder ships on every deploy; anything the entry does not import is dropped from the bundle, so extra files are harmless.

## Sharing Code Between Functions

To share code across functions, put it in `base44/shared/` — the one directory outside a function folder that the CLI uploads. Its full contents are bundled with **every** function.

```
base44/
  shared/
    response.ts    ← shared helpers
  functions/
    greet/
      entry.ts     ← import { ok } from "../../shared/response.ts";
    farewell/
      entry.ts     ← import { ok } from "../../shared/response.ts";
```

**Rules:**
- Shared code **must** live in `base44/shared/`. Files elsewhere outside the function folder are not uploaded.
- A relative import can reach a sibling (`./util.ts`) or `base44/shared/` (`../../shared/util.ts`) — but nothing further out. An import that escapes `base44/` (e.g. `../../../src/utils.ts`) fails at deploy time; move the file into `base44/shared/` instead.
- For external packages use `npm:` or `jsr:` specifiers, not relative paths.

## Common Mistakes

| Wrong | Correct | Why |
|-------|---------|-----|
| `base44/functions/myFunction.js` (single file) | `base44/functions/my-function/entry.ts` | Functions must live in a named subdirectory |
| `base44/functions/entry.ts` | `base44/functions/my-function/entry.ts` | The function name comes from the subdirectory path |
| `import { ... } from "@base44/sdk"` | `import { ... } from "npm:@base44/sdk"` | npm packages must use the `npm:` prefix |
| `MyFunction` or `myFunction` directory | `my-function` directory | Use kebab-case for directory names |
| `import { x } from "../../../src/utils.ts"` | `import { x } from "../../shared/utils.ts"` | Imports outside `base44/` are blocked — move shared code to `base44/shared/` |
