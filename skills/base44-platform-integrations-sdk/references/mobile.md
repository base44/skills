<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 integrations sdk: Integrations SDK (mobile apps)

Integrations are packages of functions that are used to interact with external data / services.

You can use integration packages from the pre-initialized base44 sdk client.
and call spefici integrations by with the relevant parameters.

<core_integrations_backend_functions>
All `base44.integrations.Core` SDK methods except `UploadPublicFile`, `UploadPrivateFile` and `CreateFileSignedUrl` must run inside a backend function using `base44.asServiceRole.integrations.Core`. Check every Core Integration call in the client code. The restricted methods cannot remain there. `UploadFile` is the retired spelling of `UploadPublicFile` and is equally client-callable.

Use a clearly named, narrow app operation, not a 1:1 Core proxy: hardcode the Core method, expose and validate only the bounded inputs the feature needs, keep privileged configuration server-side, and return only the required result. Never accept an integration name plus an arbitrary payload for forwarding.
Limit each request's cost and scope (for example prompt/file size, item count, output count, or fixed recipients/destinations) and add feature-appropriate abuse controls when available.

Upload files directly from the client with `UploadPublicFile` or `UploadPrivateFile`. Pass the resulting `file_url` or `file_uri` to a backend function for follow-on Core work such as transcription or extraction. Signing is not such work: call `CreateFileSignedUrl` from the client with the `file_uri`, rather than brokering it through a function of your own. This is the shipped default: the app profile reports `core_integrations: backend_functions_only`. Only on an app whose profile reports `client_allowed` may the client call the restricted Core methods directly.

The `base44-platform-backend-functions` skill (mobile reference) covers file placement, the frontend invocation path and testing; use the Core service-role rule above for the function body.
</core_integrations_backend_functions>

```js
import { base44 } from "@/api/base44Client";
// private end-user uploads:
const {file_uri} = await base44.integrations.Core.UploadPrivateFile({file});
const {signed_url} = await base44.integrations.Core.CreateFileSignedUrl({file_uri});

// public end-user uploads:
const {file_url} = await base44.integrations.Core.UploadPublicFile({file});
```

InvokeLLM supports an optional `model` parameter for higher quality output on complex tasks (e.g. model: "claude-sonnet-5"). Non-default models use more integration credits, so only use them when the task requires it. When you use a non-default model, tell the user that it uses more integration credits. Only 'gemini_3_flash' and 'gemini_3_1_pro' support add_context_from_internet. Using an incompatible model will raise an error.

<end_user_uploads>
Default every end-user upload to `UploadPrivateFile`. Use `UploadPublicFile` only when the user asked for these files to be public, or when something outside the app must fetch the file later without signing in.
</end_user_uploads>

`SendEmail` reaches registered app users normally. This app may ALSO email addresses that are not registered users, but only with a connected custom domain, on a paid plan, and subject to content screening, recipient-hygiene and anti-abuse limits that can refuse or pause sends — so never promise delivery to a non-registered address, and never route untrusted end-user input straight into the recipient. Invitations still use `base44.users.inviteUser`.

Here are the integration packages available in this app:

<integration_package>
  <package_name>Core</package_name>
  <package_description>Built-in integrations that are always available.</package_description>
  <endpoints>

    <endpoint>
      <name>InvokeLLM</name>
      <description>
    Generates a response from an LLM with a prompt.
    Be elaborate and detailed in your prompt.
    You can potentially ask the llm to output a json, in which case specify the json schema in response_json_schema.
    If you need to use external knowledge, use add_context_from_internet=true. This will give the LLM context from google search, google maps, news, etc. That way you can fetch structured data from the web.
    You can attach files (including images) for additional context to the LLM, using the `file_urls` parameter. This should be a list of urls after uploading them.
    You can use both file_urls AND add_context_from_internet together - the system will use a model that supports both vision and web search.
    You can optionally specify a `model` for this call. Options: 'automatic', 'gemini_3_8_flash', 'gpt_6_luna', 'claude-sonnet-5', 'claude_opus_5_5', 'gpt_6_sol', 'gpt_6_astra', 'claude_fable_5_1', 'glm_5_2'. Defaults to automatic.
    'gemini_3_8_flash' and 'gpt_6_luna' are fast; 'claude-sonnet-5' is balanced; 'claude_opus_5_5' and 'gpt_6_sol' are frontier models for hard reasoning; 'claude_fable_5_1' and 'gpt_6_astra' are the strongest and by far the most expensive.
    All models except 'glm_5_2' support file_urls. Only 'gemini_3_8_flash' supports add_context_from_internet (web search). Using an incompatible model will raise an error.
    Non-default models cost more integration credits. Only use them when the task requires higher quality.
    If response_json_schema is specified, returns a dict (so no need to parse it), otherwise returns a string.
    IMPORTANT: If specified, response_json_schema root object must by of type object, not array. i.e. {"type": "object", ...}
    </description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'prompt': {'title': 'Prompt', 'type': 'string'}, 'add_context_from_internet': {'default': False, 'title': 'Add Context From Internet', 'type': 'boolean'}, 'response_json_schema': {'anyOf': [{'additionalProperties': True, 'type': 'object'}, {'type': 'null'}], 'default': None, 'title': 'Response Json Schema'}, 'file_urls': {'anyOf': [{'format': 'binary', 'type': 'string'}, {'items': {'type': 'string'}, 'type': 'array'}, {'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'File Urls'}, 'model': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'Model'}}, 'required': ['prompt'], 'title': 'InvokeLLMModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>TranscribeAudio</name>
      <description>
    Transcribes an audio file to text using speech recognition (Whisper).
    First upload the audio file using the UploadPublicFile integration, then pass the resulting URL here.
    Returns the transcript as a plain string.
    Supported formats: ogg, oga, mp3, wav, webm, m4a, mp4, mpeg, mpga, flac. Maximum file size: 25MB.
    </description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'audio_url': {'title': 'Audio Url', 'type': 'string'}}, 'required': ['audio_url'], 'title': 'TranscribeAudioModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>SendEmail</name>
      <description>Sends email. Reaches registered app users always; reaching an address that is not a registered user requires a paid plan and a custom domain connected to the app. Optionally specify the sender name; otherwise the app name is used.</description>
      <input_schema>{'$defs': {'EmailAttachment': {'description': 'One attachment as a caller supplies it: a name plus exactly one source.\n\nNo caller-supplied content type: the extension is already constrained to the\nallowlist, so it determines the type and the two can never disagree.', 'properties': {'filename': {'description': 'Name the recipient sees, with an extension from the supported set: csv, docx, gif, ics, jpeg, jpg, md, pdf, png, txt, webp, xlsx', 'title': 'Filename', 'type': 'string'}, 'file_url': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'description': "URL or storage URI of a file THIS app already uploaded (e.g. the file_url returned by UploadFile). Another app's files are refused.", 'title': 'File Url'}, 'content': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'description': 'Base64-encoded bytes, for a document the function generated itself. Supply either this or file_url, never both.', 'title': 'Content'}}, 'required': ['filename'], 'title': 'EmailAttachment', 'type': 'object'}}, 'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'from_name': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'From Name'}, 'to': {'title': 'To', 'type': 'string'}, 'subject': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'description': "Subject line. Optional with a template: it overrides the template's own <title>.", 'title': 'Subject'}, 'body': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'Body'}, 'html': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'description': "HTML body — the same thing as 'body' under an explicit name. Set one or the other, never both.", 'title': 'Html'}, 'text': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'description': "Plain-text body. On its own, sends a plain-text email. Alongside 'body'/'html', both go out as one multipart/alternative email and the recipient's mail client renders whichever it prefers — so the two must say the same thing. Not accepted with a template: templates are HTML-only.", 'title': 'Text'}, 'template_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'Template Id'}, 'template_name': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'Template Name'}, 'variables': {'anyOf': [{'additionalProperties': True, 'type': 'object'}, {'type': 'null'}], 'default': None, 'title': 'Variables'}, 'attachments': {'anyOf': [{'items': {'$ref': '#/$defs/EmailAttachment'}, 'type': 'array'}, {'type': 'null'}], 'default': None, 'title': 'Attachments'}}, 'required': ['to'], 'title': 'SendEmailModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>SendPushNotification</name>
      <description>Sends a native mobile push notification to one app user's phone.

    Use ONLY when the user explicitly asks for mobile push notifications and the
    app ships as a native iOS/Android app. This does not reach the web app, and
    it is not email or an in-app notification — for those use SendEmail or build
    in-app UI instead. Never reach for it to "notify a user" in general.

    The app must have a native mobile build with push credentials configured;
    without that the call fails at send time, so do not build a feature around it
    unless the user confirmed they have a native mobile app.

    Server-side only: call it from a backend function via `asServiceRole` (a
    logged-in end user must not be able to push to other users).
    </description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'user_id': {'title': 'User Id', 'type': 'string'}, 'title': {'title': 'Title', 'type': 'string'}, 'content': {'title': 'Content', 'type': 'string'}, 'action_label': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'Action Label'}, 'action_url': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'Action Url'}}, 'required': ['user_id', 'title', 'content'], 'title': 'SendPushNotificationModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>UploadPublicFile</name>
      <description>
    Uploads a file to permanent, world-readable public storage.
    Returns a dict containing {"file_url": string}
    Anyone holding the url can fetch the file without signing in.
    </description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'file': {'format': 'binary', 'title': 'File', 'type': 'string'}}, 'required': ['file'], 'title': 'UploadPublicFileModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>GenerateImage</name>
      <description>Generate an image using AI.
    Takes about 5-10 seconds to generate an image.
    Be detailed in the prompt, the better the prompt, the better the image.
    Optionally provide existing_image_urls as reference - for editing, style inspiration, or visual context.
    The integration returns a URL to the generated image: {url: str}</description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'prompt': {'title': 'Prompt', 'type': 'string'}, 'existing_image_urls': {'anyOf': [{'items': {'type': 'string'}, 'type': 'array'}, {'type': 'null'}], 'default': None, 'title': 'Existing Image Urls'}}, 'required': ['prompt'], 'title': 'GenerateImageModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>GenerateSpeech</name>
      <description>Generate stored, shareable speech audio (TTS) from text. Returns an MP3 URL: {url: str}.
    Multiple voices, consistent across users, high-quality multilingual (auto-detected if language_code is omitted).
    For simple in-page playback, prefer the browser's TTS API.
    Cost: 1 integration credit per 50 characters of text, up to 100 per call.</description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'text': {'description': 'Text to convert. Max 5000 chars.', 'title': 'Text', 'type': 'string'}, 'voice': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'description': "Optional voice (default 'river'):\n- river: calm, neutral.\n- honey: warm, soft.\n- sunny: bright, upbeat.\n- storm: formal, authoritative.\n- spark: energetic, quick.", 'title': 'Voice'}, 'language_code': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'description': "Optional ISO-639-1 code (e.g. 'en', 'es'). Omit to auto-detect.", 'title': 'Language Code'}}, 'required': ['text'], 'title': 'GenerateSpeechModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>GenerateVideo</name>
      <description>Generate a video using AI.

    Takes about 30-60 seconds to generate a video using Google's Veo 3.x models.
    Be detailed in the prompt - the better the prompt, the better the video.

    The integration returns a URL to the generated video: {url: str}

    Credit Cost: 5 integration credits per second of video
    - 4 seconds = 20 credits
    - 6 seconds (default) = 30 credits
    - 8 seconds = 40 credits
    </description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'prompt': {'title': 'Prompt', 'type': 'string'}, 'duration': {'default': 6, 'enum': [4, 6, 8], 'title': 'Duration', 'type': 'integer'}, 'aspect_ratio': {'default': '16:9', 'enum': ['16:9', '9:16'], 'title': 'Aspect Ratio', 'type': 'string'}, 'generate_audio': {'default': True, 'title': 'Generate Audio', 'type': 'boolean'}}, 'required': ['prompt'], 'title': 'GenerateVideoModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>ExtractDataFromUploadedFile</name>
      <description>
    Extracts data from an uploaded file.
    Use the UploadPublicFile integration to get the file url first.
    Supports csv, xlsx, json, html, png, jpg, jpeg, and pdf files.
    Useful to extract data, and potential flow - upload file, extract data, bulk insert entities into database.
    Only use this integration when you know the target JSON schema of the data you're trying to extract (if you just want the content of a file - fetch the file url).
    returns the following object:
    {
        "status": "success" | "error",
        "details": "error details if error, otherwise null",
        "output": list[dict] | dict | None (exists if status is success)
    }
    </description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'file_url': {'title': 'File Url', 'type': 'string'}, 'json_schema': {'additionalProperties': True, 'title': 'Json Schema', 'type': 'object'}}, 'required': ['file_url', 'json_schema'], 'title': 'ExtractDataFromUploadedFileModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>CreateFileSignedUrl</name>
      <description>
    Creates a signed URL for a private file that can be used to download the file.
    The file must be uploaded to the private storage.
    Returns a dict containing {"signed_url": string}
    </description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'file_uri': {'title': 'File Uri', 'type': 'string'}, 'expires_in': {'default': 300, 'title': 'Expires In', 'type': 'integer'}}, 'required': ['file_uri'], 'title': 'CreateFileSignedUrlModel', 'type': 'object'}</input_schema>
    </endpoint>

    <endpoint>
      <name>UploadPrivateFile</name>
      <description>
    Uploads a file to the app's private filhes directory.
    Returns a dict containing {"file_uri": string}
    You can use the file_uri later to create a signed URL for the file using the CreateFileSignedUrl integration
    The file is uploaded to the private storage.
    </description>
      <input_schema>{'properties': {'app_id': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Id'}, 'app_owner': {'anyOf': [{'type': 'string'}, {'type': 'null'}], 'default': None, 'title': 'App Owner'}, 'file': {'format': 'binary', 'title': 'File', 'type': 'string'}}, 'required': ['file'], 'title': 'UploadPrivateFileModel', 'type': 'object'}</input_schema>
    </endpoint>

  </endpoints>
</integration_package>
