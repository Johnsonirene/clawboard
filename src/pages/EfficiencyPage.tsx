import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
  Legend,
} from 'recharts';
import { useDataContext } from '../App';
import { getModelColor } from '../utils/colors';
import { formatTime, formatNumber } from '../utils/format';

// ── Page transition ────────────────────────────────────────────────────────────
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

// ── Section animation ──────────────────────────────────────────────────────────
const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay, ease: 'easeOut' as const },
  }),
};

// ── Custom tooltip shell ───────────────────────────────────────────────────────
interface TooltipShellProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  formatter?: (v: number) => string;
}

function CustomTooltip({ active, payload, label, formatter }: TooltipShellProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/95 px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-slate-200 mb-1 truncate max-w-[200px]">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-slate-300">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="truncate max-w-[120px]">{entry.name}</span>
          <span className="ml-auto font-mono text-slate-100">
            {formatter ? formatter(entry.value) : String(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(56,189,248,0.12)',
          borderTop: '3px solid #38bdf8',
        }}
      />
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({
  title,
  subtitle,
  children,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      custom={delay}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-5"
    >
      <h2 className="text-base font-semibold text-slate-200">{title}</h2>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-0.5 mb-4">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-4" />}
      {children}
    </motion.div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function EfficiencyPage() {
  const { reports, efficiencyData, loading } = useDataContext();

  // ── Section 1 data: total execution time per model ──────────────────────────
  const totalTimeData = useMemo(
    () =>
      efficiencyData.map((e, i) => ({
        model: e.modelShortName,
        time: e.total_execution_time,
        color: getModelColor(i),
      })),
    [efficiencyData]
  );

  // ── Section 2 data: per-task exec time, only tasks common to ALL models ──────
  const perTaskData = useMemo(() => {
    if (reports.length === 0) return { taskNames: [], chartRows: [], models: [] };

    const modelShortNames = reports.map((r) => r.model.replace('copilot-proxy/', ''));

    // Build: model -> task_id -> execution_time
    const modelTaskTime: Record<string, Record<string, number>> = {};
    for (const report of reports) {
      const shortName = report.model.replace('copilot-proxy/', '');
      modelTaskTime[shortName] = {};
      for (const task of report.tasks) {
        modelTaskTime[shortName][task.task_id] = task.execution_time ?? 0;
      }
    }

    // Find intersection of task IDs across all models
    const taskIdSets = modelShortNames.map(
      (m) => new Set(Object.keys(modelTaskTime[m] ?? {}))
    );
    const intersection = taskIdSets.reduce((acc, set) => {
      const result = new Set<string>();
      for (const id of acc) {
        if (set.has(id)) result.add(id);
      }
      return result;
    }, taskIdSets[0] ?? new Set<string>());

    const commonTaskIds = Array.from(intersection);
    if (commonTaskIds.length === 0) return { taskNames: [], chartRows: [], models: [] };

    // Build task name lookup from first report that has it
    const taskNameMap = new Map<string, string>();
    for (const report of reports) {
      for (const task of report.tasks) {
        if (!taskNameMap.has(task.task_id)) {
          taskNameMap.set(task.task_id, task.frontmatter?.name ?? task.task_id);
        }
      }
    }

    // Build chart rows sorted by first-model exec time descending
    const rows = commonTaskIds.map((taskId) => {
      const row: Record<string, string | number> = {
        taskName: taskNameMap.get(taskId) ?? taskId,
      };
      for (const m of modelShortNames) {
        row[m] = modelTaskTime[m]?.[taskId] ?? 0;
      }
      return row;
    });

    // Sort by sum of all models' time descending
    rows.sort((a, b) => {
      const sumA = modelShortNames.reduce((s, m) => s + ((a[m] as number) || 0), 0);
      const sumB = modelShortNames.reduce((s, m) => s + ((b[m] as number) || 0), 0);
      return sumB - sumA;
    });

    return { chartRows: rows, models: modelShortNames };
  }, [reports]);

  // ── Section 4 data: token usage (conditional) ────────────────────────────────
  const tokenData = useMemo(
    () =>
      efficiencyData.map((e, i) => ({
        model: e.modelShortName,
        tokens: e.total_tokens,
        color: getModelColor(i),
      })),
    [efficiencyData]
  );
  const hasTokenData = tokenData.some((d) => d.tokens > 0);

  const isEmpty = !loading && efficiencyData.length === 0;

  // ── Chart height for per-task horizontal bar chart ───────────────────────────
  const perTaskChartHeight = Math.max(
    240,
    (perTaskData.chartRows?.length ?? 0) * Math.max(28, 14 * (reports.length + 1))
  );

  return (
    <motion.div {...pageTransition} className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
          Efficiency Metrics
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          Execution time, token usage, and request counts per model
        </p>
      </div>

      {/* Loading */}
      {loading && <Spinner />}

      {/* Empty */}
      {isEmpty && (
        <div className="flex items-center justify-center py-24">
          <p className="text-slate-500">No efficiency data available.</p>
        </div>
      )}

      {!loading && !isEmpty && (
        <>
          {/* ── Section 1: Total Execution Time ──────────────────────────────── */}
          <Section
            title="Execution Time Comparison"
            subtitle="Total execution time per model across all tasks"
            delay={0.05}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={totalTimeData}
                margin={{ top: 24, right: 24, left: 8, bottom: 8 }}
                barCategoryGap="30%"
              >
                <CartesianGrid vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="model"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatTime(v)}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      formatter={(v) => formatTime(v)}
                    />
                  }
                  cursor={{ fill: 'rgba(148,163,184,0.05)' }}
                />
                <Bar dataKey="time" name="Exec Time" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  {totalTimeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="time"
                    position="top"
                    formatter={(v: number) => formatTime(v)}
                    style={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Section 2: Per-Task Execution Time ───────────────────────────── */}
          {perTaskData.chartRows && perTaskData.chartRows.length > 0 && (
            <Section
              title="Per-Task Execution Time Distribution"
              subtitle={`Tasks common to all ${reports.length} model${reports.length !== 1 ? 's' : ''} — grouped bars`}
              delay={0.12}
            >
              <ResponsiveContainer width="100%" height={perTaskChartHeight}>
                <BarChart
                  data={perTaskData.chartRows}
                  layout="vertical"
                  margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
                  barCategoryGap="20%"
                  barGap={2}
                >
                  <CartesianGrid horizontal={false} stroke="#1e293b" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatTime(v)}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="taskName"
                    width={160}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip formatter={(v) => formatTime(v)} />}
                    cursor={{ fill: 'rgba(148,163,184,0.05)' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }}
                  />
                  {(perTaskData.models ?? []).map((model, idx) => (
                    <Bar
                      key={model}
                      dataKey={model}
                      fill={getModelColor(idx)}
                      radius={[0, 3, 3, 0]}
                      maxBarSize={18}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Section>
          )}

          {/* ── Section 3: Request Count Cards ───────────────────────────────── */}
          <Section
            title="Request Count Comparison"
            subtitle="Total API requests made per model"
            delay={0.19}
          >
            <div className="flex flex-wrap gap-3">
              {efficiencyData.map((entry, i) => {
                const color = getModelColor(i);
                // total_requests comes from efficiency.total_requests on the report
                const report = reports.find(
                  (r) => r.model.replace('copilot-proxy/', '') === entry.modelShortName
                );
                const requests = report?.efficiency?.total_requests ?? 0;

                return (
                  <motion.div
                    key={entry.modelShortName}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.19 + i * 0.05, duration: 0.22 }}
                    className="flex flex-col gap-1 rounded-xl border px-5 py-4 backdrop-blur-sm min-w-[160px] flex-1"
                    style={{
                      background: `${color}0d`,
                      borderColor: `${color}33`,
                    }}
                  >
                    {/* Color dot + model name */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span
                        className="text-xs font-medium text-slate-300 truncate"
                        title={entry.modelShortName}
                      >
                        {entry.modelShortName}
                      </span>
                    </div>
                    {/* Request count */}
                    <div
                      className="text-2xl font-bold font-mono tabular-nums"
                      style={{ color }}
                    >
                      {formatNumber(requests)}
                    </div>
                    <div className="text-[0.65rem] uppercase tracking-wider text-slate-500 font-semibold">
                      Total Requests
                    </div>
                    {/* Task count sub-stat */}
                    <div className="text-xs text-slate-500 mt-1">
                      {entry.task_count} task{entry.task_count !== 1 ? 's' : ''}
                      {entry.task_count > 0 && requests > 0 && (
                        <span className="ml-1 text-slate-600">
                          · {(requests / entry.task_count).toFixed(1)} req/task
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>

          {/* ── Section 4: Token Usage (conditional) ─────────────────────────── */}
          <Section
            title="Token Usage"
            subtitle={
              hasTokenData
                ? 'Total tokens consumed per model'
                : undefined
            }
            delay={0.26}
          >
            {!hasTokenData ? (
              <div className="flex items-center justify-center py-10 text-slate-500 text-sm">
                No token usage data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={tokenData}
                  margin={{ top: 24, right: 24, left: 8, bottom: 8 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid vertical={false} stroke="#1e293b" />
                  <XAxis
                    dataKey="model"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNumber(v)}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        formatter={(v) => formatNumber(v) + ' tokens'}
                      />
                    }
                    cursor={{ fill: 'rgba(148,163,184,0.05)' }}
                  />
                  <Bar dataKey="tokens" name="Total Tokens" radius={[4, 4, 0, 0]} maxBarSize={56}>
                    {tokenData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="tokens"
                      position="top"
                      formatter={(v: number) => formatNumber(v)}
                      style={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
        </>
      )}
    </motion.div>
  );
}
