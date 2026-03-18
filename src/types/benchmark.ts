export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  total_tokens: number;
  cost_usd: number;
  request_count: number;
}

export interface GradingRun {
  task_id: string;
  score: number;
  max_score: number;
  grading_type: string;
  breakdown: Record<string, number>;
  notes: string;
}

export interface Grading {
  runs: GradingRun[];
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface Frontmatter {
  id: string;
  name: string;
  category: string;
  grading_type: string;
  timeout_seconds: number;
  workspace_files: string[];
}

export interface TaskResult {
  task_id: string;
  status: string;
  timed_out: boolean;
  execution_time: number;
  transcript_length: number;
  usage: TokenUsage;
  workspace: string;
  grading: Grading;
  frontmatter: Frontmatter;
}

export interface EfficiencyPerTask {
  task_id: string;
  score: number;
  total_tokens: number;
  cost_usd: number;
  tokens_per_score_point: number;
}

export interface Efficiency {
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  total_requests: number;
  total_execution_time_seconds: number;
  tasks_with_usage_data: number;
  tokens_per_task: number;
  cost_per_task_usd: number;
  score_per_1k_tokens: number | null;
  score_per_dollar: number | null;
  per_task: EfficiencyPerTask[];
}

export interface BenchmarkReport {
  model: string;
  benchmark_version: string;
  run_id: string;
  timestamp: number;
  suite: string;
  runs_per_task: number;
  tasks: TaskResult[];
  efficiency: Efficiency;
}

export interface RankedReport extends BenchmarkReport {
  rank: number;
  averageScore: number;
  passRate: number;
  /** Weighted combination: 0.6 × averageScore + 0.4 × speedScore (0–1). */
  valueScore: number;
}
