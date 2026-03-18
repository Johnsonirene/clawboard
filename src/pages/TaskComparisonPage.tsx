import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useDataContext } from '../App';
import { formatScore } from '../utils/format';

// ── Page transition ────────────────────────────────────────────────────────────
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

// ── Stagger variants ───────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

// ── Heat color: rose → amber → emerald (same as CategoryPage) ─────────────────
function scoreToHeatColor(score: number): string {
  const s = Math.max(0, Math.min(1, score));
  let r: number, g: number, b: number;

  if (s < 0.5) {
    const t = s / 0.5;
    r = Math.round(244 + (245 - 244) * t);
    g = Math.round(63 + (158 - 63) * t);
    b = Math.round(94 + (11 - 94) * t);
  } else {
    const t = (s - 0.5) / 0.5;
    r = Math.round(245 + (16 - 245) * t);
    g = Math.round(158 + (185 - 158) * t);
    b = Math.round(11 + (129 - 11) * t);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

// ── Tooltip state ──────────────────────────────────────────────────────────────
interface CellTooltip {
  visible: boolean;
  score: number;
  taskName: string;
  model: string;
  x: number;
  y: number;
}

// ── Loading spinner ─────────────────────────────────────────────────────────────
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

// ── Color legend bar ─────────────────────────────────────────────────────────
function ColorLegend() {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <span>Low</span>
      <div
        className="h-2.5 rounded flex-1 max-w-[200px]"
        style={{
          background:
            'linear-gradient(to right, rgb(244,63,94), rgb(245,158,11), rgb(16,185,129))',
        }}
      />
      <span>High</span>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function TaskComparisonPage() {
  const { reports, taskMatrix, loading } = useDataContext();
  const tableRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<CellTooltip>({
    visible: false,
    score: 0,
    taskName: '',
    model: '',
    x: 0,
    y: 0,
  });

  // Derive ordered list of model short names from reports (ranked order)
  const models = useMemo(() => {
    return reports.map((r) => r.model.replace('copilot-proxy/', ''));
  }, [reports]);

  // Build a lookup: task_id -> { name, category } from the first report that has it
  const taskMeta = useMemo(() => {
    const map = new Map<string, { name: string; category: string }>();
    for (const report of reports) {
      for (const task of report.tasks) {
        if (!map.has(task.task_id)) {
          map.set(task.task_id, {
            name: task.frontmatter?.name ?? task.task_id,
            category: task.frontmatter?.category ?? 'Unknown',
          });
        }
      }
    }
    return map;
  }, [reports]);

  // Group taskMatrix rows by category, preserving insertion order within each group
  const groupedRows = useMemo(() => {
    const groups = new Map<string, typeof taskMatrix>();
    for (const row of taskMatrix) {
      const category = taskMeta.get(row.task_id)?.category ?? 'Unknown';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category)!.push(row);
    }
    return groups;
  }, [taskMatrix, taskMeta]);

  const categories = useMemo(() => Array.from(groupedRows.keys()).sort(), [groupedRows]);

  // Column width for model columns
  const colW = 80;
  const taskColW = 220;

  function handleCellEnter(
    e: React.MouseEvent<HTMLDivElement>,
    score: number,
    taskName: string,
    model: string
  ) {
    if (!tableRef.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const gridRect = tableRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      score,
      taskName,
      model,
      x: rect.left - gridRect.left + rect.width / 2,
      y: rect.top - gridRect.top - 8,
    });
  }

  function handleCellLeave() {
    setTooltip((t) => ({ ...t, visible: false }));
  }

  const isEmpty = !loading && taskMatrix.length === 0;

  return (
    <motion.div {...pageTransition} className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Task Score Comparison
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          Per-task scores for every model — grouped by category
        </p>
      </div>

      {/* Loading */}
      {loading && <Spinner />}

      {/* Empty */}
      {isEmpty && (
        <div className="flex items-center justify-center py-24">
          <p className="text-slate-500">No task data available.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="rounded-xl border border-slate-700/50 backdrop-blur-md overflow-hidden"
          style={{ background: 'rgba(15, 23, 42, 0.45)' }}
        >
          {/* Legend + meta row */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40 bg-slate-900/40">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              {taskMatrix.length} tasks · {models.length} models
            </span>
            <ColorLegend />
          </div>

          {/* Scrollable table area */}
          <div className="overflow-auto" style={{ maxHeight: '74vh' }}>
            <div ref={tableRef} className="relative" style={{ minWidth: taskColW + models.length * colW }}>

              {/* ── Sticky header ─────────────────────────────────────────── */}
              <div
                className="sticky top-0 z-20 flex border-b border-slate-700/60 bg-slate-900/95 backdrop-blur"
                style={{ minWidth: taskColW + models.length * colW }}
              >
                {/* Task name column header */}
                <div
                  className="sticky left-0 z-30 flex items-end px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-900/95 border-r border-slate-700/40"
                  style={{ width: taskColW, minWidth: taskColW }}
                >
                  Task
                </div>
                {/* Model headers */}
                {models.map((model) => (
                  <div
                    key={model}
                    className="flex items-end justify-center px-1 py-3 text-xs font-semibold text-slate-300"
                    style={{ width: colW, minWidth: colW }}
                    title={model}
                  >
                    <span
                      className="truncate text-center"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        maxHeight: 100,
                        fontSize: '0.68rem',
                      }}
                    >
                      {model}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Category groups ───────────────────────────────────────── */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {categories.map((category) => {
                  const rows = groupedRows.get(category) ?? [];
                  return (
                    <div key={category}>
                      {/* Category divider */}
                      <div
                        className="sticky left-0 flex items-center px-4 py-2 border-b border-slate-700/30"
                        style={{
                          background:
                            'linear-gradient(to right, rgba(30,41,59,0.95), rgba(15,23,42,0.6))',
                          zIndex: 10,
                          minWidth: taskColW + models.length * colW,
                        }}
                      >
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-sky-400/80 mr-3">
                          {category}
                        </span>
                        <div className="flex-1 h-px bg-slate-700/30" />
                        <span className="ml-3 text-[0.65rem] text-slate-600">
                          {rows.length} task{rows.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Task rows */}
                      {rows.map((row) => {
                        const taskName = taskMeta.get(row.task_id)?.name ?? row.task_id;
                        const isHovered = hoveredRow === row.task_id;

                        return (
                          <motion.div
                            key={row.task_id}
                            variants={rowVariants}
                            className="flex border-b border-slate-700/20 transition-colors duration-100"
                            style={{
                              background: isHovered
                                ? 'rgba(148,163,184,0.06)'
                                : 'transparent',
                              minWidth: taskColW + models.length * colW,
                            }}
                            onMouseEnter={() => setHoveredRow(row.task_id)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            {/* Task name — sticky left */}
                            <div
                              className="sticky left-0 z-10 flex items-center px-4 py-2.5 border-r border-slate-700/30 transition-colors duration-100"
                              style={{
                                width: taskColW,
                                minWidth: taskColW,
                                background: isHovered
                                  ? 'rgba(30,41,59,0.97)'
                                  : 'rgba(15,23,42,0.92)',
                              }}
                            >
                              <span
                                className="text-xs text-slate-300 font-medium truncate"
                                title={taskName}
                              >
                                {taskName}
                              </span>
                            </div>

                            {/* Score cells */}
                            {models.map((model) => {
                              const raw = row[model];
                              const score =
                                typeof raw === 'number' && isFinite(raw) ? raw : null;

                              if (score === null) {
                                return (
                                  <div
                                    key={model}
                                    className="flex items-center justify-center text-slate-600 text-xs"
                                    style={{ width: colW, minWidth: colW, height: 40 }}
                                  >
                                    —
                                  </div>
                                );
                              }

                              const bg = scoreToHeatColor(score);
                              const textColor =
                                score > 0.55
                                  ? 'rgba(0,0,0,0.78)'
                                  : 'rgba(255,255,255,0.85)';

                              return (
                                <div
                                  key={model}
                                  className="flex items-center justify-center"
                                  style={{ width: colW, minWidth: colW, padding: '4px 3px' }}
                                >
                                  <div
                                    className="rounded-md cursor-default transition-transform hover:scale-110 hover:z-10 relative flex items-center justify-center text-xs font-semibold select-none"
                                    style={{
                                      width: colW - 8,
                                      height: 32,
                                      backgroundColor: bg,
                                      color: textColor,
                                      fontSize: '0.68rem',
                                    }}
                                    onMouseEnter={(e) =>
                                      handleCellEnter(e, score, taskName, model)
                                    }
                                    onMouseLeave={handleCellLeave}
                                  >
                                    {formatScore(score)}
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </motion.div>

              {/* Floating tooltip */}
              {tooltip.visible && (
                <div
                  className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-600 bg-slate-800/95 px-3 py-2 shadow-xl text-xs"
                  style={{ left: tooltip.x, top: tooltip.y }}
                >
                  <p className="font-semibold text-slate-200 truncate max-w-[180px]">
                    {tooltip.taskName}
                  </p>
                  <p className="text-slate-400 mt-0.5 truncate max-w-[180px]">{tooltip.model}</p>
                  <p className="font-mono text-sky-300 mt-0.5 font-bold">
                    {formatScore(tooltip.score)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
