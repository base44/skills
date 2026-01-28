# base44 agents push

Push local AI agent configurations to Base44. Agents are conversational AI assistants that can interact with users, access your app's entities, and call backend functions.

## Syntax

```bash
npx base44 agents push
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Reads all agent files from the `base44/agents/` directory
2. Validates agent configurations
3. Displays the count of agents to be pushed
4. Uploads agents to the Base44 backend
5. Reports the results: created, updated, and deleted agents

## Prerequisites

- Must be run from a Base44 project directory
- Project must have agent definitions in the `base44/agents/` folder

## Output

```bash
$ npx base44 agents push

Found 2 agents to push
Pushing agents to Base44...

Created: support_agent
Updated: order_bot
Deleted: old_agent

✓ Agents pushed to Base44
```

## Agent Synchronization

The push operation synchronizes your local agents with Base44:

- **Created**: New agents that didn't exist in Base44
- **Updated**: Existing agents with modified configuration
- **Deleted**: Agents that were removed from your local configuration

**Warning**: This is a full sync operation. Agents removed locally will be deleted from Base44.

## Error Handling

If no agents are found in your project:
```bash
$ npx base44 agents push
No local agents found - this will delete all remote agents
```

If an agent has an invalid name:
```bash
$ npx base44 agents push
Error: Agent name must be lowercase alphanumeric with underscores
```

## Agent Configuration Schema

Each agent file should be a `.jsonc` file in `base44/agents/` with this structure:

```jsonc
{
  "name": "agent_name",
  "description": "Brief description of what this agent does",
  "instructions": "Detailed instructions for the agent's behavior",
  "tool_configs": [
    // Entity tool - gives agent access to entity operations
    { "entity_name": "tasks", "allowed_operations": ["read", "create", "update", "delete"] },
    // Backend function tool - gives agent access to a function
    { "function_name": "send_email", "description": "Send an email notification" }
  ],
  "whatsapp_greeting": "Hello! How can I help you today?"
}
```

**Naming rules:**
- Agent names must be lowercase alphanumeric with underscores only
- Valid: `support_agent`, `order_bot`, `task_helper`
- Invalid: `Support-Agent`, `OrderBot`, `task helper`

## Use Cases

- After defining new agents in your project
- When modifying existing agent configurations
- To sync agent changes before testing
- As part of your development workflow when agent behavior changes

## Notes

- This command syncs the agent configuration, not conversation data
- Changes are applied to your Base44 project immediately
- Make sure to test agent changes in a development environment first
- Agent definitions are located in the `base44/agents/` directory
- Use `base44 agents pull` to download agents from Base44
