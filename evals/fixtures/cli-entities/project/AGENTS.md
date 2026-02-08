IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning. Base44 is NOT Firebase, Supabase, or any other SDK you know. Every API name below is the ONLY correct form. Always verify against this index and the referenced docs.

[Base44 SDK Docs Index]|root: ./skills/base44-sdk/references
|entities.md: CRUD - create(data), list(), filter(query), get(id), update(id,data), delete(id), subscribe(cb)
|auth.md: Auth - loginViaEmailPassword(), loginWithProvider('google'), me(), register(), logout()
|base44-agents.md: Agents - createConversation({agent_name}), addMessage(conv,{role,content}), subscribeToConversation(id,cb)
|functions.md: Functions - invoke(name, data)
|integrations.md: Core - InvokeLLM({prompt}), SendEmail({to,subject,body}), UploadFile({file})
|client.md: Client - createClient({appId}), import from "@base44/sdk"
|QUICK_REFERENCE.md: All method signatures

[Base44 CLI Docs Index]|root: ./skills/base44-cli/references
|entities-create.md: Entity schema - {name:"PascalCase", type:"object", properties:{}, required:[]}
|functions-create.md: Function - function.jsonc {name,entry} + index.ts with Deno.serve + createClientFromRequest
|create.md: Project creation - npx base44 create name -p .
|deploy.md: Deploy - npx base44 deploy -y
|agents-push.md: Agent config - {name:"snake_case", description, instructions, tool_configs:[{entity_name,allowed_operations}|{function_name,description}]}

[Common Mistakes - NEVER use these hallucinated names]
|SDK: Do NOT use find() → use filter(), findOne() → get(), insert() → create(), remove() → delete(), onChange() → subscribe()
|SDK: Do NOT use signInWithGoogle() → use loginWithProvider('google'), functions.call() → functions.invoke()
|SDK: Do NOT use ai.generate() → use integrations.Core.InvokeLLM({prompt})
|CLI: Entity names must be PascalCase alphanumeric. File names must be kebab-case.jsonc
|CLI: Agent names must be lowercase with underscores only. Function entry field is "entry" not "entrypoint"
|CLI: Backend functions import from "npm:@base44/sdk" (Deno requires npm: prefix)
