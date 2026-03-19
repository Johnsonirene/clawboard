import { useState, useEffect } from 'react';
import { BenchmarkReport, RankedReport } from '../types/benchmark';
import { getShortModelName } from '../utils/format';

export interface CategoryData {
  [category: string]: {
    [modelShortName: string]: number;
  };
}

export interface TaskMatrixRow {
  task_id: string;
  [modelShortName: string]: number | string;
}

export interface EfficiencyEntry {
  model: string;
  modelShortName: string;
  total_execution_time: number;
  total_tokens: number;
  total_cost_usd: number;
  task_count: number;
}

export interface BenchmarkDataResult {
  reports: RankedReport[];
  categoryData: CategoryData;
  taskMatrix: TaskMatrixRow[];
  efficiencyData: EfficiencyEntry[];
  loading: boolean;
  error: string | null;
}

function computeAverageScore(report: BenchmarkReport): number {
  const tasks = report.tasks;
  if (!tasks || tasks.length === 0) return 0;

  const validMeans = tasks
    .map((t) => t.grading?.mean)
    .filter((m): m is number => typeof m === 'number' && !isNaN(m));

  if (validMeans.length === 0) return 0;
  return validMeans.reduce((sum, m) => sum + m, 0) / validMeans.length;
}

function computePassRate(report: BenchmarkReport): number {
  const tasks = report.tasks;
  if (!tasks || tasks.length === 0) return 0;
  const successful = tasks.filter((t) => t.status === 'success').length;
  return successful / tasks.length;
}

function buildCategoryData(reports: RankedReport[]): CategoryData {
  // category -> modelShortName -> list of scores (to average)
  const accumulator: { [category: string]: { [model: string]: number[] } } = {};

  for (const report of reports) {
    const modelShort = getShortModelName(report.model);
    for (const task of report.tasks) {
      const category = task.frontmatter?.category ?? 'unknown';
      const score = task.grading?.mean;
      if (typeof score !== 'number' || isNaN(score)) continue;

      if (!accumulator[category]) {
        accumulator[category] = {};
      }
      if (!accumulator[category][modelShort]) {
        accumulator[category][modelShort] = [];
      }
      accumulator[category][modelShort].push(score);
    }
  }

  const result: CategoryData = {};
  for (const category of Object.keys(accumulator)) {
    result[category] = {};
    for (const model of Object.keys(accumulator[category])) {
      const scores = accumulator[category][model];
      result[category][model] = scores.reduce((s, v) => s + v, 0) / scores.length;
    }
  }
  return result;
}

function buildTaskMatrix(reports: RankedReport[]): TaskMatrixRow[] {
  // Collect all unique task_ids (preserve insertion order from first report)
  const taskIdSet = new Set<string>();
  for (const report of reports) {
    for (const task of report.tasks) {
      taskIdSet.add(task.task_id);
    }
  }

  // Build a lookup: modelShortName -> task_id -> score
  const modelScores: { [model: string]: { [taskId: string]: number } } = {};
  for (const report of reports) {
    const modelShort = getShortModelName(report.model);
    if (!modelScores[modelShort]) {
      modelScores[modelShort] = {};
    }
    for (const task of report.tasks) {
      const score = task.grading?.mean;
      if (typeof score === 'number' && !isNaN(score)) {
        modelScores[modelShort][task.task_id] = score;
      }
    }
  }

  const models = Object.keys(modelScores);

  const rows: TaskMatrixRow[] = [];
  for (const task_id of taskIdSet) {
    const row: TaskMatrixRow = { task_id };
    for (const model of models) {
      row[model] = modelScores[model][task_id] ?? NaN;
    }
    rows.push(row);
  }

  return rows;
}

function buildEfficiencyData(reports: RankedReport[]): EfficiencyEntry[] {
  return reports.map((report) => {
    const modelShort = getShortModelName(report.model);
    const eff = report.efficiency;
    return {
      model: report.model,
      modelShortName: modelShort,
      total_execution_time: eff?.total_execution_time_seconds ?? 0,
      total_tokens: eff?.total_tokens ?? 0,
      total_cost_usd: eff?.total_cost_usd ?? 0,
      task_count: report.tasks?.length ?? 0,
    };
  });
}

export function useBenchmarkData(): BenchmarkDataResult {
  const [reports, setReports] = useState<RankedReport[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData>({});
  const [taskMatrix, setTaskMatrix] = useState<TaskMatrixRow[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch manifest
        const manifestRes = await fetch('/data/manifest.json');
        if (!manifestRes.ok) {
          throw new Error(`Failed to fetch manifest: ${manifestRes.status} ${manifestRes.statusText}`);
        }
        const manifest: { files: string[] } = await manifestRes.json();

        if (!manifest.files || manifest.files.length === 0) {
          if (!cancelled) {
            setReports([]);
            setCategoryData({});
            setTaskMatrix([]);
            setEfficiencyData([]);
            setLoading(false);
          }
          return;
        }

        // 2. Fetch all JSON files in parallel
        const fileResults = await Promise.allSettled(
          manifest.files.map(async (file) => {
            const res = await fetch(`/data/${file}`);
            if (!res.ok) {
              throw new Error(`Failed to fetch ${file}: ${res.status}`);
            }
            return res.json() as Promise<BenchmarkReport>;
          })
        );

        const rawReports: BenchmarkReport[] = [];
        const fetchErrors: string[] = [];

        for (const result of fileResults) {
          if (result.status === 'fulfilled') {
            rawReports.push(result.value);
          } else {
            fetchErrors.push(result.reason?.message ?? 'Unknown fetch error');
          }
        }

        if (fetchErrors.length > 0) {
          console.warn('Some benchmark files failed to load:', fetchErrors);
        }

        // 3. Compute averageScore and passRate for each report
        const withScores = rawReports.map((report) => ({
          ...report,
          averageScore: computeAverageScore(report),
          passRate: computePassRate(report),
          rank: 0,       // placeholder, assigned below
          valueScore: 0, // placeholder, assigned below
        }));

        // 4. Compute valueScore = 0.6 × averageScore + 0.4 × speedScore
        //    speedScore is the min-max normalized inverse of avg execution time per task.
        const avgTimes = withScores.map((r) => {
          const taskCount = r.tasks.length;
          return taskCount > 0
            ? (r.efficiency?.total_execution_time_seconds ?? 0) / taskCount
            : 0;
        });
        const minTime = Math.min(...avgTimes);
        const maxTime = Math.max(...avgTimes);
        const timeRange = maxTime - minTime;

        const withValueScores = withScores.map((r, i) => {
          const speedScore = timeRange > 0 ? 1 - (avgTimes[i] - minTime) / timeRange : 1;
          return { ...r, valueScore: 0.5 * r.averageScore + 0.5 * speedScore };
        });

        // 5. Sort by valueScore descending, assign ranks (1-based)
        withValueScores.sort((a, b) => b.valueScore - a.valueScore);
        const ranked: RankedReport[] = withValueScores.map((r, i) => ({ ...r, rank: i + 1 }));

        // 6. Compute aggregated data
        const catData = buildCategoryData(ranked);
        const matrix = buildTaskMatrix(ranked);
        const effData = buildEfficiencyData(ranked);

        if (!cancelled) {
          setReports(ranked);
          setCategoryData(catData);
          setTaskMatrix(matrix);
          setEfficiencyData(effData);
          setLoading(false);
          if (fetchErrors.length > 0 && rawReports.length === 0) {
            setError(`All files failed to load: ${fetchErrors.join('; ')}`);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { reports, categoryData, taskMatrix, efficiencyData, loading, error };
}
