import type { CodingAgent, CodingAgentResponse } from '../types.js';

/**
 * Mock agent for testing the eval infrastructure.
 * Returns a predefined response based on the prompt.
 */
export class MockAgent implements CodingAgent {
  name = 'mock';

  async run(prompt: string, workingDir: string): Promise<CodingAgentResponse> {
    console.log(`[MockAgent] Running in: ${workingDir}`);
    console.log(`[MockAgent] Prompt: ${prompt.substring(0, 100)}...`);

    // Simulate different responses based on prompt content
    let output = '';
    const skillsInvoked: string[] = [];

    if (prompt.toLowerCase().includes('entity') || prompt.toLowerCase().includes('todo')) {
      output = `I'll create the entity files for you.

Here's the Todo entity in \`base44/entities/todo.jsonc\`:

\`\`\`jsonc
{
  "name": "Todo",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "The todo title"
    },
    "completed": {
      "type": "boolean",
      "default": false
    }
  },
  "required": ["title"]
}
\`\`\`

To push these entities to Base44, run:
\`\`\`bash
npx base44 entities push
\`\`\`
`;
      skillsInvoked.push('base44-cli');
    } else if (prompt.toLowerCase().includes('function')) {
      output = `I'll create the function for you.

Creating \`base44/functions/send-order-notification/function.jsonc\`:

\`\`\`jsonc
{
  "name": "send-order-notification",
  "description": "Sends notification emails for order status changes"
}
\`\`\`

And \`base44/functions/send-order-notification/index.ts\`:

\`\`\`typescript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const { order_id, new_status } = await req.json();

  const order = await base44.asServiceRole.entities.Order.get(order_id);
  const user = await base44.asServiceRole.entities.User.get(order.user_id);

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: user.email,
    subject: \`Order Status Update\`,
    body: \`Your order status is now: \${new_status}\`
  });

  return Response.json({ success: true });
});
\`\`\`

Deploy with:
\`\`\`bash
npx base44 functions deploy
\`\`\`
`;
      skillsInvoked.push('base44-cli');
    } else if (prompt.toLowerCase().includes('tasklist') || prompt.toLowerCase().includes('sdk')) {
      output = `I'll implement the TaskList component using the Base44 SDK.

\`\`\`typescript
import { useState, useEffect } from 'react';
import { base44 } from '../lib/base44';

interface Task {
  id: string;
  title: string;
  status: string;
  due_date?: string;
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const data = await base44.entities.Task.list();
    setTasks(data);
  }

  async function toggleComplete(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await base44.entities.Task.update(task.id, { status: newStatus });
    loadTasks();
  }

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id} onClick={() => toggleComplete(task)}>
          {task.title} - {task.status}
        </li>
      ))}
    </ul>
  );
}
\`\`\`
`;
      skillsInvoked.push('base44-sdk');
    } else {
      output = `I can help you with that. This is a Base44 project.`;
    }

    return {
      output,
      skillsInvoked,
      metadata: {
        mock: true,
        workingDir,
      },
    };
  }
}
