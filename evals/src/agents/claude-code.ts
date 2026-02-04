import { execSync } from 'child_process';
import type { CodingAgent, CodingAgentResponse } from '../types.js';

// Skill markers for detecting which skills were invoked
const skillMarkers: Record<string, RegExp[]> = {
  'base44-cli': [
    // CLI commands
    /base44\s+(entities|functions|agents)\s+(push|deploy|pull|create)/i,
    /npx\s+base44/i,
    /yarn\s+base44/i,
    /pnpm\s+base44/i,
    // File paths (more flexible patterns)
    /base44\/entities\/[\w-]+\.jsonc/i,
    /base44\/functions\/[\w-]+\//i,
    /base44\/agents\/[\w_]+\.jsonc/i,
    /`base44\/entities\//i,
    /`base44\/functions\//i,
    /`base44\/agents\//i,
    // Config files
    /function\.jsonc/i,
    /\.jsonc.*entity|entity.*\.jsonc/i,
    // Deno/function patterns
    /Deno\.serve/i,
    /createClientFromRequest/i,
    /npm:@base44\/sdk/i,
    // Generic mentions
    /entities\s+push/i,
    /functions\s+deploy/i,
    /agents\s+push/i,
    // Agent config patterns
    /tool_configs/i,
    /entity_name.*allowed_operations|allowed_operations.*entity_name/i,
    /function_name.*description|"function_name"/i,
  ],
  'base44-sdk': [
    // SDK imports
    /@base44\/sdk/i,
    /from\s+['"]@base44\/sdk['"]/i,
    /import.*createClient.*from.*@base44\/sdk/i,
    // Entity operations (flexible)
    /base44\.entities\.\w+\.(create|list|filter|update|delete|get|subscribe)/i,
    /entities\.[A-Z]\w*\.(create|list|filter|update|delete|get|subscribe)/i,
    /\.entities\.\w+\.list\(\)/i,
    /\.entities\.\w+\.create\(/i,
    /\.entities\.\w+\.update\(/i,
    // Integrations
    /integrations\.Core\./i,
    /SendEmail|InvokeLLM|UploadFile|GenerateImage/i,
    // Auth
    /base44\.auth\./i,
    // Functions invoke
    /base44\.functions\.invoke/i,
    /functions\.invoke/i,
    // Agent SDK methods
    /base44\.agents\./i,
    /\.agents\.createConversation/i,
    /\.agents\.addMessage/i,
    /\.agents\.subscribeToConversation/i,
    /\.agents\.getConversation/i,
    /createConversation.*agent_name|agent_name.*createConversation/i,
    /addMessage.*role.*content|role.*user.*content/i,
    /subscribeToConversation/i,
    // Service role
    /asServiceRole/i,
  ],
};

function detectSkills(output: string): string[] {
  const detectedSkills: Set<string> = new Set();

  for (const [skill, patterns] of Object.entries(skillMarkers)) {
    for (const pattern of patterns) {
      if (pattern.test(output)) {
        detectedSkills.add(skill);
        break;
      }
    }
  }

  return Array.from(detectedSkills);
}

export class ClaudeCodeAgent implements CodingAgent {
  name = 'claude-code';
  verbose = false;

  async run(prompt: string, workingDir: string): Promise<CodingAgentResponse> {
    try {
      if (this.verbose) {
        console.log(`[ClaudeCode] Working dir: ${workingDir}`);
      }

      // Escape the prompt for shell
      const escapedPrompt = prompt.replace(/"/g, '\\"');
      const command = `claude -p "${escapedPrompt}"`;

      if (this.verbose) {
        console.log(`[ClaudeCode] Running: ${command}`);
      }

      const output = execSync(command, {
        cwd: workingDir,
        encoding: 'utf8',
        timeout: 300000, // 5 minute timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (this.verbose) {
        console.log(`[ClaudeCode] Output length: ${output.length}`);
        console.log(`[ClaudeCode] Output preview: ${output.substring(0, 200)}`);
      }

      const skillsInvoked = detectSkills(output);

      return {
        output,
        skillsInvoked,
        metadata: {
          exitCode: 0,
        },
      };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message?: string };
      const errorMessage = execError.message || String(error);
      const stdout = execError.stdout || '';
      const stderr = execError.stderr || '';

      if (this.verbose) {
        console.log(`[ClaudeCode] Error: ${errorMessage}`);
        console.log(`[ClaudeCode] Stdout: ${stdout}`);
        console.log(`[ClaudeCode] Stderr: ${stderr}`);
      }

      // If we got output despite error, use it
      const output = stdout || stderr || `Error running Claude Code: ${errorMessage}`;
      const skillsInvoked = detectSkills(output);

      return {
        output,
        skillsInvoked,
        metadata: {
          error: errorMessage,
        },
      };
    }
  }
}
