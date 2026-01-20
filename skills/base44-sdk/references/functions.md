# Functions Module

Invoke custom backend functions via `base44.functions`.

## Contents
- [Method](#method)
- [Invoking Functions](#invoking-functions) (Frontend, File Upload, Service Role)
- [Writing Backend Functions](#writing-backend-functions) (Basic, Service Role, Secrets, Errors)
- [Setup Requirements](#setup-requirements)
- [Authentication Modes](#authentication-modes)

## Method

```javascript
base44.functions.invoke(functionName, data): Promise<any>
```

- `functionName`: Name of the backend function
- `data`: Object of parameters (sent as JSON, or multipart if contains File objects)
- Returns: Whatever the function returns

## Invoking Functions

### From Frontend

```javascript
const result = await base44.functions.invoke("processOrder", {
  orderId: "order-123",
  action: "ship"
});

console.log(result);
```

### With File Upload

```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

// Automatically uses multipart/form-data when File objects present
const result = await base44.functions.invoke("uploadDocument", {
  file: file,
  category: "invoices"
});
```

### With Service Role (Backend)

```javascript
// Inside another backend function
const result = await base44.asServiceRole.functions.invoke("adminTask", {
  userId: "user-123"
});
```

## Writing Backend Functions

Backend functions run on Deno. Must export using `Deno.serve()`.

### Basic Structure

```javascript
// functions/processOrder.js
import { createClientFromRequest } from "@base44/sdk";

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

### With Service Role Access

```javascript
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

### Using Secrets

```javascript
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

### Error Handling

```javascript
Deno.serve(async (req) => {
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
});
```

## Setup Requirements

1. Enable Backend Functions in app settings (requires appropriate plan)
2. Create function files in `/functions` folder
3. Configure secrets via app dashboard for API keys

## Authentication Modes

| Mode | Context | Permissions |
|------|---------|-------------|
| User | `base44.functions.invoke()` | Runs under calling user's permissions |
| Service Role | `base44.asServiceRole.functions.invoke()` | Admin-level access |

Inside the function, use `createClientFromRequest(req)` to get a client that inherits the caller's auth context.
