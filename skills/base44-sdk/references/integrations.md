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
- `model` (string, optional): Override the app-level model setting for this call. One of: `gemini_3_8_flash`, `gpt_6_luna`, `claude-sonnet-5`, `claude_opus_5_5`, `gpt_6_sol`, `gpt_6_astra`, `claude_fable_5_1`, `glm_5_2`, `gemini_3_1_pro`, `gpt_5_4`, `claude_sonnet_4_6`, `claude_opus_4_6`, `claude_opus_4_7`, `claude_opus_4_8`, `claude_opus_5`, `gpt_5_6_terra`, `gpt_5_6_sol`, `gpt_5_6_luna`
- `add_context_from_internet` (boolean, optional): If true, uses Google Search/Maps/News for real-time context. Default `false`
- `response_json_schema` (object, optional): JSON schema for structured output
- `file_urls` (string[], optional): URLs of uploaded files for context. Don't use together with `add_context_from_internet`

> `InvokeLLM` is a **single call with no tools**. Don't chain it to simulate an agent loop — for a tool-using agent, build a **code agent** on the AI gateway. See [ai-gateway.md](ai-gateway.md).

### GenerateImage

Create AI-generated images from text prompts, optionally using existing images as references.

```javascript
const { url } = await base44.integrations.Core.GenerateImage({
  prompt: "A serene mountain landscape with a lake"
});
console.log(url); // https://...generated_image.png
```

```javascript
// Edit/reference existing images
const { url } = await base44.integrations.Core.GenerateImage({
  prompt: "Make the sky look like sunset",
  existing_image_urls: ["https://...original_image.png"]
});
```

**Parameters:**
- `prompt` (string, required): Description of the image. When passing `existing_image_urls`, describe what to do with the reference images instead
- `existing_image_urls` (string[], optional): URLs of images to use as references (edit, style match, visual context). Unreadable images are skipped; if none can be read, the request fails

### SendEmail

Send emails to registered users of your app. To email anyone else, the app needs a paid plan and a connected custom domain.

```javascript
await base44.integrations.Core.SendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Hello</h1><p>Welcome to our app.</p>",
  text: "Hello! Welcome to our app.",
  from_name: "My App"  // optional, defaults to app name
});
```

```javascript
// With attachments
await base44.integrations.Core.SendEmail({
  to: "user@example.com",
  subject: "Your invoice",
  text: "Your invoice is attached.",
  attachments: [
    { filename: "invoice.pdf", file_url: uploadedFileUrl },
    { filename: "chart.png", content: base64PngString },
  ],
});
```

**Parameters:**
- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject line
- `body` (string, optional): HTML email body. Same as `html` — set one or the other, not both
- `html` (string, optional): HTML email body. Same as `body` — set one or the other, not both
- `text` (string, optional): Plain-text body. Alone, sends plain-text only; combined with `body`/`html`, sends both so the recipient's mail client picks the one it prefers (keep them saying the same thing)
- `from_name` (string, optional): Sender name displayed to recipient (defaults to the app's name)
- `attachments` (`EmailAttachment[]`, optional): Up to 5 files, up to 5 MB each and 10 MB total. Each needs `filename` and exactly one of `file_url` (a file your app already uploaded, e.g. via `UploadFile`/`UploadPrivateFile`) or `content` (base64-encoded contents for a file your code generated). Supported `filename` extensions: `csv`, `docx`, `gif`, `ics`, `jpeg`, `jpg`, `md`, `pdf`, `png`, `txt`, `webp`, `xlsx`

Set at least one of `body`, `html`, or `text`.

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
  expires_in: 1800  // 30 minutes
});
```

**Parameters:**
- `file_uri` (string, required): URI from UploadPrivateFile
- `expires_in` (number, optional): Expiration time in seconds, from 60 to 3600 (default: 300)

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
  operationId, // Endpoint in "method:path" format (e.g. "get:/contacts", "post:/repos/{owner}/{repo}/issues")
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

### Errors

`call()` throws:
- A plain `Error` if `slug` is missing/empty, or if `operationId` is missing/empty.
- A `Base44Error` (404) if the integration or operation isn't found.
- A `Base44Error` (502) if the external API call fails.
- A `Base44Error` (504) if the request times out.

## Requirements

- **Core integrations**: Available on all plans
- **Catalog/Custom integrations**: Require Builder plan or higher

## Authentication Modes

- **Anonymous or user authentication** (`base44.integrations`): methods run with the current user's permissions (or anonymously, where the app allows it).
- **Service role authentication** (`base44.asServiceRole.integrations`): methods run with the service role, for backend code that needs elevated permissions.

## Type Definitions

### Core Integration Parameters

```typescript
/** Parameters for the InvokeLLM function. */
interface InvokeLLMParams {
  /** The prompt text to send to the model. */
  prompt: string;
  /** Optional model override for this call (app-level model setting is used otherwise). */
  model?: 'gemini_3_8_flash' | 'gpt_6_luna' | 'claude-sonnet-5' | 'claude_opus_5_5' | 'gpt_6_sol' | 'gpt_6_astra' | 'claude_fable_5_1' | 'glm_5_2' | 'gemini_3_1_pro' | 'gpt_5_4' | 'claude_sonnet_4_6' | 'claude_opus_4_6' | 'claude_opus_4_7' | 'claude_opus_4_8' | 'claude_opus_5' | 'gpt_5_6_terra' | 'gpt_5_6_sol' | 'gpt_5_6_luna';
  /** If true, uses Google Search/Maps/News for real-time context. Default false. */
  add_context_from_internet?: boolean;
  /** JSON schema for structured output. If provided, returns object instead of string. */
  response_json_schema?: object;
  /** File URLs (from UploadFile) to provide as context. Don't combine with add_context_from_internet. */
  file_urls?: string[];
}

/** Parameters for the GenerateImage function. */
interface GenerateImageParams {
  /** Description of the image to generate (or of the edit, when existing_image_urls is set). */
  prompt: string;
  /** Reference image URLs, for edits/style/visual context. Unreadable images are skipped. */
  existing_image_urls?: string[];
}

/** Result from GenerateImage. */
interface GenerateImageResult {
  /** URL of the generated image. */
  url: string;
}

/** Parameters for the UploadFile function. */
interface UploadFileParams {
  /** The file object to upload. */
  file: File;
}

/** Result from UploadFile. */
interface UploadFileResult {
  /** URL of the uploaded file. */
  file_url: string;
}

/** A file to attach to an email. */
interface EmailAttachment {
  /** Shown filename, including extension. Supported: csv, docx, gif, ics, jpeg, jpg, md, pdf, png, txt, webp, xlsx. */
  filename: string;
  /** A file your app already uploaded (e.g. UploadFile's file_url or UploadPrivateFile's file_uri). */
  file_url?: string;
  /** Base64-encoded contents, for a file your code generated. */
  content?: string;
}

/** Parameters for the SendEmail function. Set at least one of body, html, or text. */
interface SendEmailParams {
  /** Recipient email address. */
  to: string;
  /** Email subject line. */
  subject: string;
  /** HTML email body. Same as html — set one or the other, not both. */
  body?: string;
  /** HTML email body. Same as body — set one or the other, not both. */
  html?: string;
  /** Plain-text body. Alone, sends plain-text only; with body/html, sends both. */
  text?: string;
  /** Sender name (defaults to app name). */
  from_name?: string;
  /** Up to 5 files, up to 5 MB each / 10 MB total. */
  attachments?: EmailAttachment[];
}

/** Parameters for ExtractDataFromUploadedFile. */
interface ExtractDataFromUploadedFileParams {
  /** URL of the uploaded file. */
  file_url: string;
  /** JSON schema defining fields to extract. */
  json_schema: object;
}

/** Parameters for UploadPrivateFile. */
interface UploadPrivateFileParams {
  /** The file object to upload. */
  file: File;
}

/** Result from UploadPrivateFile. */
interface UploadPrivateFileResult {
  /** URI of the private file (used for signed URLs). */
  file_uri: string;
}

/** Parameters for CreateFileSignedUrl. */
interface CreateFileSignedUrlParams {
  /** URI from UploadPrivateFile. */
  file_uri: string;
  /** Expiration time in seconds, from 60 to 3600 (default: 300). */
  expires_in?: number;
}

/** Result from CreateFileSignedUrl. */
interface CreateFileSignedUrlResult {
  /** Temporary signed URL to access the file. */
  signed_url: string;
}
```

### CoreIntegrations

```typescript
/** Core package containing built-in Base44 integration functions. */
interface CoreIntegrations {
  InvokeLLM(params: InvokeLLMParams): Promise<string | object>;
  GenerateImage(params: GenerateImageParams): Promise<GenerateImageResult>;
  UploadFile(params: UploadFileParams): Promise<UploadFileResult>;
  SendEmail(params: SendEmailParams): Promise<any>;
  ExtractDataFromUploadedFile(params: ExtractDataFromUploadedFileParams): Promise<object>;
  UploadPrivateFile(params: UploadPrivateFileParams): Promise<UploadPrivateFileResult>;
  CreateFileSignedUrl(params: CreateFileSignedUrlParams): Promise<CreateFileSignedUrlResult>;
}
```

### Custom Integrations

```typescript
/** Parameters for calling a custom integration method. */
interface CustomIntegrationCallParams {
  /** Request body payload. */
  payload?: Record<string, any>;
  /** Path parameters to substitute in the URL. For example, { owner: "user", repo: "repo" }. */
  pathParams?: Record<string, string>;
  /** Query string parameters. */
  queryParams?: Record<string, any>;
}

/** Response from a custom integration call. */
interface CustomIntegrationCallResponse {
  /** Whether the external API returned a 2xx status code. */
  success: boolean;
  /** The HTTP status code from the external API. */
  status_code: number;
  /** The response data from the external API. */
  data: any;
}

/** Module for calling custom pre-configured API integrations. */
interface CustomIntegrationsModule {
  /**
   * Call a custom integration method.
   * @param slug - The integration's unique identifier (set by workspace admin).
   * @param operationId - The endpoint in "method:path" format (e.g. "get:/contacts", "post:/users/{id}").
   * @param params - Optional payload, pathParams, queryParams.
   * @throws {Error} If slug is not provided.
   * @throws {Error} If operationId is not provided.
   * @throws {Base44Error} If the integration or operation is not found (404).
   * @throws {Base44Error} If the external API call fails (502).
   * @throws {Base44Error} If the request times out (504).
   */
  call(slug: string, operationId: string, params?: CustomIntegrationCallParams): Promise<CustomIntegrationCallResponse>;
}
```

### IntegrationsModule

```typescript
/** Integrations module for calling integration methods. */
type IntegrationsModule = {
  /** Core package with built-in integrations. */
  Core: CoreIntegrations;
  /** Custom integrations module. */
  custom: CustomIntegrationsModule;
  /** Additional integration packages (dynamic). */
  [packageName: string]: any;
};
```
