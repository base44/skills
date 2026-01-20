# Integrations Module

Access third-party services via `base44.integrations`.

## Types of Integrations

1. **Core/Built-in**: AI, email, file uploads (available by default)
2. **Catalog integrations**: Pre-built connectors from Base44 catalog
3. **Custom integrations**: Your own OpenAPI-based integrations

## Accessing Integrations

```javascript
// Core integrations
base44.integrations.Core.FunctionName(params)

// Custom integrations
base44.integrations.custom.call(slug, operationId, params)
```

## Core Integrations

### InvokeLLM (AI Text Generation)

Generate text or structured JSON data using AI models.

```javascript
// Basic prompt - returns string
const response = await base44.integrations.Core.InvokeLLM({
  prompt: "Summarize this text: ..."
});

// With internet context (uses Google Search, Maps, News)
const response = await base44.integrations.Core.InvokeLLM({
  prompt: "What's the current weather in NYC?",
  add_context_from_internet: true
});

// Structured JSON response - returns object
const response = await base44.integrations.Core.InvokeLLM({
  prompt: "Analyze the sentiment of: 'Great product but slow shipping'",
  response_json_schema: {
    type: "object",
    properties: {
      sentiment: { type: "string", enum: ["positive", "negative", "mixed"] },
      score: { type: "number", description: "Score from 1-10" },
      key_points: { type: "array", items: { type: "string" } }
    }
  }
});
// Returns: { sentiment: "mixed", score: 7, key_points: ["great product", "slow shipping"] }

// With file attachments (uploaded via UploadFile)
const response = await base44.integrations.Core.InvokeLLM({
  prompt: "Describe what's in this image",
  file_urls: ["https://...uploaded_image.png"]
});
```

**Parameters:**
- `prompt` (string, required): The prompt text to send to the model
- `add_context_from_internet` (boolean, optional): If true, uses Google Search/Maps/News for real-time context
- `response_json_schema` (object, optional): JSON schema for structured output
- `file_urls` (string[], optional): URLs of uploaded files for context

### GenerateImage

Create AI-generated images from text prompts.

```javascript
const { url } = await base44.integrations.Core.GenerateImage({
  prompt: "A serene mountain landscape with a lake"
});
console.log(url); // https://...generated_image.png
```

### SendEmail

Send emails to registered users. Every app gets this integration (no plan upgrade required).

```javascript
await base44.integrations.Core.SendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  body: "<h1>Hello</h1><p>Welcome to our app.</p>",
  from_name: "My App"  // optional, defaults to app name
});
```

**Parameters:**
- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject line
- `body` (string, required): Plain text or HTML email body
- `from_name` (string, optional): Sender name displayed to recipient

**Limitations:**
- 1 credit per email (2 credits with custom domain)

### UploadFile (Public)

Upload files to public storage.

```javascript
const fileInput = document.querySelector('input[type="file"]');
const { file_url } = await base44.integrations.Core.UploadFile({
  file: fileInput.files[0]
});
console.log(file_url); // https://...uploaded_file.pdf
```

### UploadPrivateFile

Upload files to private storage that requires a signed URL to access.

```javascript
const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
  file: fileInput.files[0]
});
console.log(file_uri); // "private/user123/document.pdf"

// Create a signed URL to access the file
const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
  file_uri,
  expires_in: 3600  // URL expires in 1 hour (default: 300 seconds)
});
console.log(signed_url); // Temporary URL to access the private file
```

### CreateFileSignedUrl

Generate temporary access links for private files.

```javascript
const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
  file_uri: "private/user123/document.pdf",
  expires_in: 7200  // 2 hours
});
```

**Parameters:**
- `file_uri` (string, required): URI from UploadPrivateFile
- `expires_in` (number, optional): Expiration time in seconds (default: 300)

### ExtractDataFromUploadedFile

Extract structured data from uploaded files using AI.

```javascript
// First upload the file
const { file_url } = await base44.integrations.Core.UploadFile({ file });

// Then extract structured data
const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
  file_url,
  json_schema: {
    type: "object",
    properties: {
      invoice_number: { type: "string" },
      total_amount: { type: "number" },
      date: { type: "string" },
      vendor_name: { type: "string" }
    }
  }
});
console.log(result); // { invoice_number: "INV-12345", total_amount: 1250.00, ... }
```

## Custom Integrations

Custom integrations allow workspace administrators to connect any external API by importing an OpenAPI specification. Use `base44.integrations.custom.call()` to invoke them.

### Syntax

```javascript
const response = await base44.integrations.custom.call(
  slug,        // Integration identifier (set by admin)
  operationId, // Endpoint in "method:path" format
  params       // Optional: payload, pathParams, queryParams
);
```

### Examples

```javascript
// GET request with query params
const response = await base44.integrations.custom.call(
  "my-crm",
  "get:/contacts",
  { queryParams: { limit: 10, status: "active" } }
);

// POST request with body
const response = await base44.integrations.custom.call(
  "my-crm",
  "post:/contacts",
  { payload: { name: "John Doe", email: "john@example.com" } }
);

// Request with path parameters
const response = await base44.integrations.custom.call(
  "github",
  "post:/repos/{owner}/{repo}/issues",
  {
    pathParams: { owner: "myorg", repo: "myrepo" },
    payload: { title: "Bug report", body: "Something is broken" }
  }
);
```

### Response Structure

```javascript
{
  success: true,      // Whether external API returned 2xx
  status_code: 200,   // HTTP status code
  data: { ... }       // Response from external API
}
```

## Requirements

- **Core integrations**: Available on all plans
- **Catalog/Custom integrations**: Require Builder plan or higher
