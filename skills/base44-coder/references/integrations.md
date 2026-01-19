# Integrations Module

Access third-party services via `base44.integrations`.

## Types of Integrations

1. **Core/Built-in**: Email, AI, file uploads (available by default)
2. **Catalog integrations**: Pre-built connectors from Base44 catalog
3. **Custom integrations**: Your own OpenAPI-based integrations

## Accessing Integrations

```javascript
// Core integrations
base44.integrations.Core.methodName()

// Custom integrations
base44.integrations.custom.IntegrationName.methodName()
```

## Built-in Email

Every app gets a `SendEmail` integration (no plan upgrade required).

```javascript
await base44.integrations.Core.SendEmail({
  to: userId,           // Must be a registered user ID
  subject: "Welcome!",
  body: "<h1>Hello</h1><p>Welcome to our app.</p>",
  senderName: "My App"  // optional
});
```

**Limitations:**
- Can only send to registered users (not arbitrary emails)
- No attachments with built-in email
- 1 credit per email (2 credits with custom domain)

## AI Integrations

Connect to AI providers (requires Builder plan).

```javascript
const response = await base44.integrations.Core.AI({
  prompt: "Summarize this text: ...",
  model: "gpt-4"
});

console.log(response.text);
```

## Custom Integrations

Create in Base44 dashboard:
1. Import OpenAPI spec
2. Configure credentials (API keys stored as secrets)
3. Access from any app in workspace

```javascript
// After setting up "WeatherAPI" custom integration
const weather = await base44.integrations.custom.WeatherAPI.getCurrentWeather({
  city: "San Francisco"
});
```

## File Uploads

```javascript
const fileInput = document.querySelector('input[type="file"]');
const result = await base44.integrations.Core.uploadFile({
  file: fileInput.files[0],
  folder: "documents"
});
console.log(result.url);
```

## Requirements

- **Built-in integrations**: Available on all plans
- **Catalog/Custom integrations**: Require Builder plan or higher
