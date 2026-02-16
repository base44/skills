[Base44 SDK Docs Index]|root: ./skills/base44-sdk/references
|IMPORTANT: Always read referenced docs before writing Base44 code. Do NOT guess API names.
|entities.md: CRUD operations on data models
|  create(data:object) -> record, list() -> record[], filter(query:object, sort?:string, limit?:number, skip?:number) -> record[]
|  get(id:string) -> record, update(id:string, data:object) -> record, delete(id:string) -> void
|  subscribe(callback:(records)=>void) -> unsubscribe, importEntities(file, entityName) -> {imported}
|auth.md: Authentication and user management
|  loginViaEmailPassword(email, password), loginWithProvider('google'), register({email, password, full_name})
|  me() -> user|null, logout(), updateMe(data), isLoggedIn() -> boolean
|base44-agents.md: AI agent conversations
|  createConversation({agent_name}) -> conversation, addMessage(conversation, {role:'user', content}) -> response
|  subscribeToConversation(id, callback) -> unsubscribe, getConversation(id), getConversations()
|functions.md: Backend function invocation
|  invoke(functionName:string, data:object) -> result
|integrations.md: Built-in integrations
|  Core.InvokeLLM({prompt, response_json_schema?}) -> {response}, Core.SendEmail({to,subject,body})
|  Core.UploadFile({file}) -> {file_url}, Core.GenerateImage({prompt}) -> {url}
|client.md: SDK client setup
|  createClient({appId:string}) -> client, import from "@base44/sdk" (frontend) or "npm:@base44/sdk" (Deno backend)
|  createClientFromRequest(req) -> client (backend only), client.asServiceRole.* (admin access, backend only)

[Base44 CLI Docs Index]|root: ./skills/base44-cli/references
|IMPORTANT: Always read referenced docs before configuring Base44 resources.
|entities-create.md: Entity schema - {name:"PascalCase", type:"object", properties:{field:{type,description}}, required:[]}
|  File naming: base44/entities/{kebab-case}.jsonc. Types: string, number, integer, boolean, array, object, binary
|  String formats: date, date-time, email, uri, file, richtext. Enums: add "enum":["val1","val2"]
|functions-create.md: Function setup
|  function.jsonc: {name:"func-name", entry:"index.ts"} (NOT "entrypoint")
|  index.ts: import {createClientFromRequest} from "npm:@base44/sdk"; Deno.serve(async(req)=>{...})
|create.md: Project creation - npx base44 create name -p . (templates: backend-and-client, backend-only)
|deploy.md: Deploy all - npx base44 deploy -y. Individual: entities push, functions deploy, agents push, site deploy -y
|agents-push.md: Agent config
|  {name:"snake_case", description, instructions, tool_configs:[{entity_name,allowed_operations}|{function_name,description}]}
|  Names: /^[a-z0-9_]+$/ only. Operations: read, create, update, delete

[Common Mistakes]
|SDK: Do NOT use find() -> use filter(), findOne() -> get(), insert() -> create(), remove() -> delete(), onChange() -> subscribe()
|SDK: Do NOT use signInWithGoogle() -> use loginWithProvider('google'), functions.call() -> functions.invoke()
|SDK: Do NOT use ai.generate() -> use integrations.Core.InvokeLLM({prompt})
|CLI: Entity names must be PascalCase alphanumeric. File names must be kebab-case.jsonc
|CLI: Agent names must be lowercase with underscores only. Function entry field is "entry" not "entrypoint"
|CLI: Backend functions import from "npm:@base44/sdk" (Deno requires npm: prefix)
