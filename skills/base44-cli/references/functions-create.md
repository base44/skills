# Creating Functions

Base44 functions are serverless backend functions defined locally in your project and deployed to the Base44 backend.

## Function Directory

All function definitions must be placed in the `base44/functions/` folder in your project. Each function lives in its own subdirectory with a configuration file and entry point.

Example structure:
```
my-app/
  base44/
    functions/
      process-order/
        function.jsonc
        index.ts
      send-notification/
        function.jsonc
        index.ts
```

## How to Create a Function

1. Create a new directory in `base44/functions/` with your function name (use kebab-case)
2. Create a `function.jsonc` configuration file in the directory
3. Create the entry point file (e.g., `index.ts`)
4. Deploy the function using the CLI

## Function Configuration

Each function requires a `function.jsonc` configuration file:

```jsonc
{
  "name": "my-function",
  "entry": "index.ts"
}
```

### Configuration Properties

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Function name (must not contain dots) | Yes |
| `entry` | Entry point file path relative to the function directory | Yes |

## Entry Point File

The entry point file must export a default async function that handles requests:

```typescript
export default async function main(req: Request) {
  // Parse request body if needed
  const body = await req.json();
  
  // Your function logic here
  
  // Return a Response
  return new Response(JSON.stringify({ success: true }));
}
```

### Request Object

The function receives a standard `Request` object with:
- `req.json()` - Parse JSON body
- `req.text()` - Get raw text body
- `req.headers` - Access request headers
- `req.method` - HTTP method

### Response Object

Return a standard `Response` object:

```typescript
// JSON response
return new Response(JSON.stringify({ data: result }), {
  headers: { "Content-Type": "application/json" }
});

// Error response
return new Response(JSON.stringify({ error: "Something went wrong" }), {
  status: 400,
  headers: { "Content-Type": "application/json" }
});
```

## Complete Example

### Directory Structure
```
base44/
  functions/
    process-order/
      function.jsonc
      index.ts
```

### function.jsonc
```jsonc
{
  "name": "process-order",
  "entry": "index.ts"
}
```

### index.ts
```typescript
export default async function main(req: Request) {
  const body = await req.json();
  
  // Validate the order
  if (!body.orderId) {
    return new Response(JSON.stringify({ error: "Order ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Process the order
  const result = {
    success: true,
    orderId: body.orderId,
    processedAt: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
```

## Naming Conventions

- **Directory name**: Use kebab-case (e.g., `process-order`, `send-notification`)
- **Function name**: Match the directory name, no dots allowed
- **Entry file**: Typically `index.ts` or `index.js`

## Deploying Functions

After creating your function, deploy it to Base44:

```bash
npx base44 functions deploy
```

For more details on deploying, see [functions-deploy.md](functions-deploy.md).

## Notes

- Functions are deployed as serverless functions on Base44's infrastructure
- Each function runs in its own isolated environment
- Functions support TypeScript out of the box
- Make sure to handle errors gracefully and return appropriate HTTP status codes
