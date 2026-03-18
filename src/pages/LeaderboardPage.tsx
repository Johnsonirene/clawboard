import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useDataContext } from '../App';
import { getScoreColor, RANK_COLORS } from '../utils/colors';
import { formatScore, formatTime, getShortModelName } from '../utils/format';
import type { RankedReport } from '../types/benchmark';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTotalExecutionTime(report: RankedReport): number {
  return report.tasks.reduce((sum, t) => sum + (t.execution_time ?? 0), 0);
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{ background: '#3a2e00', color: RANK_COLORS.gold, border: `1px solid ${RANK_COLORS.gold}` }}
      >
        <span>♛</span>
        <span>#1</span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{ background: '#1e2330', color: RANK_COLORS.silver, border: `1px solid ${RANK_COLORS.silver}` }}
      >
        <span>#2</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{ background: '#2a1800', color: RANK_COLORS.bronze, border: `1px solid ${RANK_COLORS.bronze}` }}
      >
        <span>#3</span>
      </span>
    );
  }
  return (
    <span className="text-slate-400 font-mono text-sm">#{rank}</span>
  );
}

// ---------------------------------------------------------------------------
// Custom Recharts tooltip
// ---------------------------------------------------------------------------
interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0].value;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-1 truncate max-w-[180px]">{label}</p>
      <p className="font-bold" style={{ color: getScoreColor(value) }}>
        {formatScore(value)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded per-task chart
// ---------------------------------------------------------------------------
function TaskChart({ report }: { report: RankedReport }) {
  const chartData = report.tasks.map((t) => ({
    name: t.frontmatter?.name ?? t.task_id,
    score: typeof t.grading?.mean === 'number' && isFinite(t.grading.mean) ? t.grading.mean : 0,
  }));

  // Sort descending by score so the chart reads nicely
  chartData.sort((a, b) => b.score - a.score);

  return (
    <div className="px-4 pb-4 pt-2">
      <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
        Per-task scores
      </p>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 28)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getScoreColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard row
// ---------------------------------------------------------------------------
interface RowProps {
  report: RankedReport;
  isExpanded: boolean;
  onToggle: () => void;
}

function LeaderboardRow({ report, isExpanded, onToggle }: RowProps) {
  const shortName = getShortModelName(report.model);
  const score = report.averageScore;
  const scoreColor = getScoreColor(score);
  const totalTime = getTotalExecutionTime(report);
  const runIdShort = report.run_id ? report.run_id.slice(0, 8) : '—';

  return (
    <motion.div variants={rowVariants}>
      {/* Main row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
        className="grid cursor-pointer select-none transition-colors duration-150 hover:bg-slate-800/50 focus:outline-none focus:bg-slate-800/50"
        style={{ gridTemplateColumns: '72px 1fr 190px 130px 80px 100px 110px 32px' }}
      >
        {/* Rank */}
        <div className="flex items-center justify-center px-3 py-4">
          <RankBadge rank={report.rank} />
        </div>

        {/* Model */}
        <div className="flex flex-col justify-center px-4 py-4 min-w-0">
          <span className="text-slate-100 font-semibold text-sm truncate">{shortName}</span>
          <span className="text-slate-500 text-xs font-mono mt-0.5">{runIdShort}…</span>
        </div>

        {/* Score */}
        <div className="flex flex-col justify-center px-4 py-4 gap-1.5">
          <span className="text-sm font-bold" style={{ color: scoreColor }}>
            {formatScore(score)}
          </span>
          <div className="w-full h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(score * 100, 100)}%`, background: scoreColor }}
            />
          </div>
        </div>

        {/* Value Score */}
        <div className="flex flex-col justify-center px-4 py-4 gap-1.5">
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: '#a78bfa' }}
            title="价值分 = 0.6 × 得分 + 0.4 × 速度分（速度分为平均任务耗时的归一化倒数）"
          >
            {formatScore(report.valueScore)}
          </span>
          <div className="w-full h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(report.valueScore * 100, 100)}%`, background: '#a78bfa' }}
            />
          </div>
        </div>

        {/* Tasks */}
        <div className="flex items-center justify-center px-4 py-4">
          <span className="text-slate-300 text-sm tabular-nums">{report.tasks.length}</span>
        </div>

        {/* Pass Rate */}
        <div className="flex items-center justify-center px-4 py-4">
          <span className="text-slate-300 text-sm tabular-nums">
            {formatScore(report.passRate)}
          </span>
        </div>

        {/* Execution Time */}
        <div className="flex items-center justify-center px-4 py-4">
          <span className="text-slate-400 text-sm tabular-nums font-mono">
            {formatTime(totalTime)}
          </span>
        </div>

        {/* Expand chevron */}
        <div className="flex items-center justify-center pr-3">
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-500 text-xs"
          >
            ▼
          </motion.span>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-700/50 bg-slate-900/60"
          >
            <TaskChart report={report} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Summary stat card
// ---------------------------------------------------------------------------
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-4 rounded-xl bg-slate-800/50 border border-slate-700/40 backdrop-blur-sm min-w-[140px]">
      <span className="text-xl font-bold text-slate-100">{value}</span>
      <span className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LeaderboardPage() {
  const { reports, loading } = useDataContext();
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const totalParticipants = reports.length;
  const highestScore = reports.length > 0 ? Math.max(...reports.map((r) => r.averageScore)) : 0;
  const averageScore =
    reports.length > 0
      ? reports.reduce((sum, r) => sum + r.averageScore, 0) / reports.length
      : 0;

  function toggleRow(runId: string) {
    setExpandedRunId((prev) => (prev === runId ? null : runId));
  }

  return (
    <motion.div {...pageTransition} className="space-y-6">
      {/* Page title */}
      <div>
        <h2
          className="text-3xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(90deg, #e2e8f0 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Score Leaderboard
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Ranked by average score across all benchmark tasks
        </p>
      </div>

      {/* Summary stats */}
      {!loading && reports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="flex flex-wrap gap-3"
        >
          <StatCard label="Participants" value={String(totalParticipants)} />
          <StatCard label="Highest Score" value={formatScore(highestScore)} />
          <StatCard label="Average Score" value={formatScore(averageScore)} />
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <svg
            className="animate-spin w-6 h-6 mr-3"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading benchmark data…
        </div>
      )}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-2">
          <span className="text-4xl">📭</span>
          <p className="text-sm">No benchmark reports found.</p>
        </div>
      )}

      {/* Leaderboard table */}
      {!loading && reports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="rounded-xl overflow-hidden border border-slate-700/50 backdrop-blur-md"
          style={{ background: 'rgba(15, 23, 42, 0.4)' }}
        >
          {/* Table header */}
          <div
            className="grid text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-700/50 bg-slate-900/50"
            style={{ gridTemplateColumns: '72px 1fr 190px 130px 80px 100px 110px 32px' }}
          >
            <div className="flex items-center justify-center px-3 py-3">Rank</div>
            <div className="flex items-center px-4 py-3">Model</div>
            <div className="flex items-center px-4 py-3">Score</div>
            <div className="flex items-center px-4 py-3" style={{ color: '#a78bfa' }} title="价值分 = 0.6 × 得分 + 0.4 × 速度分">
              Value
            </div>
            <div className="flex items-center justify-center px-4 py-3">Tasks</div>
            <div className="flex items-center justify-center px-4 py-3">Pass Rate</div>
            <div className="flex items-center justify-center px-4 py-3">Exec Time</div>
            <div />
          </div>

          {/* Rows */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-slate-700/30"
          >
            {reports.map((report) => (
              <LeaderboardRow
                key={report.run_id}
                report={report}
                isExpanded={expandedRunId === report.run_id}
                onToggle={() => toggleRow(report.run_id)}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
