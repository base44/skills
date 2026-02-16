export interface CodingAgentResponse {
  output: string;
  skillsInvoked: string[];
  metadata?: Record<string, unknown>;
}

export interface CodingAgent {
  name: string;
  run(prompt: string, workingDir: string): Promise<CodingAgentResponse>;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  details?: string;
}

export interface EvalContext {
  agentResponse: CodingAgentResponse;
  fixtureDir: string;
  projectDir: string;
  checkConfig: CheckConfig;
}

export interface Check {
  type: string;
  run(context: EvalContext): Promise<CheckResult>;
}

export interface CheckConfig {
  type: string;
  description: string;
  target?: 'output' | 'file';
  filePath?: string;
  expectedValid?: boolean;
  value?: string;
  pattern?: string;
  command?: string;
  schema?: Record<string, unknown>;
}

export interface PromptConfig {
  name: string;
  description?: string;
  prompt: string;
  expectedSkills: string[];
  checks: CheckConfig[];
}

export interface EvalConfig {
  name: string;
  description: string;
  // Single-prompt (backward compat)
  prompt?: string;
  expectedSkills?: string[];
  checks?: CheckConfig[];
  // Multi-prompt
  prompts?: PromptConfig[];
}

export interface ExpandedFixture {
  name: string;
  description: string;
  fixtureDir: string;
  prompt: string;
  expectedSkills: string[];
  checks: CheckConfig[];
}

export interface FixtureResult {
  name: string;
  description: string;
  fixtureDir: string;
  prompt: string;
  expectedSkills: string[];
  skillsInvoked: string[];
  skillCheckPassed: boolean;
  checks: CheckResult[];
  passed: boolean;
  agentOutput: string;
  error?: string;
}

export interface SuiteResult {
  name: string;
  fixtures: FixtureResult[];
  passed: number;
  failed: number;
}

export interface EvalRunResult {
  name: string;
  date: Date;
  agent: string;
  suites: SuiteResult[];
  totalPassed: number;
  totalFailed: number;
}

// Experiment configuration
export interface Experiment {
  name: string;           // Directory name
  skillsDir: string;      // Absolute path to skills
  skills: string[];       // Skill names found
}

// Result for one experiment across all fixtures
export interface ExperimentRunResult {
  experiment: string;
  date: Date;
  agent: string;
  suites: SuiteResult[];
  totalPassed: number;
  totalFailed: number;
}

// Full comparison result
export interface ComparisonResult {
  name: string;
  date: Date;
  agent: string;
  experiments: string[];
  fixtures: string[];
  matrix: Record<string, Record<string, boolean>>; // exp -> fixture -> passed
  experimentResults: ExperimentRunResult[];
  summary: {
    byExperiment: Record<string, { passed: number; failed: number; total: number }>;
    byFixture: Record<string, { passedExperiments: string[]; failedExperiments: string[] }>;
    bestExperiment: string;
  };
}
