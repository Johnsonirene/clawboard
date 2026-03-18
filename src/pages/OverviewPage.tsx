import { motion } from 'framer-motion';
import { useDataContext } from '../App';
import SectionCard from '../components/SectionCard';
import { RANK_COLORS, getScoreColor } from '../utils/colors';
import { formatScore, formatTime, formatNumber } from '../utils/format';

// ─── Page transition ───────────────────────────────────────────────────────────
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.25 },
};

// ─── Inline SVG icons ──────────────────────────────────────────────────────────
function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H3.5a2.5 2.5 0 0 0 0 5H6" />
      <path d="M18 9h2.5a2.5 2.5 0 0 1 0 5H18" />
      <path d="M6 3h12v10a6 6 0 0 1-12 0V3Z" />
      <path d="M9 21h6" />
      <path d="M12 17v4" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14.5" />
    </svg>
  );
}

// ─── Loading spinner ────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid rgba(56,189,248,0.15)',
          borderTop: '3px solid #38bdf8',
        }}
      />
    </div>
  );
}

// ─── Rank badge colors ─────────────────────────────────────────────────────────
function rankColor(rank: number): string {
  if (rank === 1) return RANK_COLORS.gold;
  if (rank === 2) return RANK_COLORS.silver;
  if (rank === 3) return RANK_COLORS.bronze;
  return '#64748b';
}

// ─── Heatmap cell background ──────────────────────────────────────────────────
function heatmapCellBg(score: number): string {
  if (score >= 0.7) return `rgba(16, 185, 129, ${0.15 + score * 0.5})`;
  if (score >= 0.4) return `rgba(245, 158, 11, ${0.12 + score * 0.45})`;
  return `rgba(244, 63, 94, ${0.12 + (1 - score) * 0.4})`;
}

// ─── Card preview: Leaderboard top-3 ──────────────────────────────────────────
interface LeaderboardPreviewProps {
  reports: ReturnType<typeof useDataContext>['reports'];
}

function LeaderboardPreview({ reports }: LeaderboardPreviewProps) {
  const top3 = reports.slice(0, 3);

  if (top3.length === 0) {
    return <span style={{ color: '#475569', fontSize: '0.85rem' }}>No data</span>;
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {top3.map((r) => (
        <div
          key={r.model}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.5rem 0.65rem',
            borderRadius: '0.6rem',
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(51,65,85,0.35)',
          }}
        >
          {/* Rank badge */}
          <div
            style={{
              width: '1.6rem',
              height: '1.6rem',
              borderRadius: '50%',
              background: `${rankColor(r.rank)}22`,
              border: `1.5px solid ${rankColor(r.rank)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: rankColor(r.rank),
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {r.rank}
          </div>
          {/* Model name */}
          <div
            style={{
              flex: 1,
              fontSize: '0.78rem',
              color: '#cbd5e1',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {r.model.replace('copilot-proxy/', '')}
          </div>
          {/* Score — right-aligned, tabular */}
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
              fontVariantNumeric: 'tabular-nums',
              color: getScoreColor(r.averageScore),
              flexShrink: 0,
              textAlign: 'right',
              minWidth: '3.2rem',
            }}
          >
            {formatScore(r.averageScore)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Card preview: Category heatmap (top models × all categories) ─────────────
interface CategoryPreviewProps {
  categoryData: ReturnType<typeof useDataContext>['categoryData'];
  reports: ReturnType<typeof useDataContext>['reports'];
}

function CategoryPreview({ categoryData, reports }: CategoryPreviewProps) {
  const categories = Object.keys(categoryData).slice(0, 8);
  const topModels = reports
    .slice(0, 3)
    .map((r) => r.model.replace('copilot-proxy/', ''));

  if (categories.length === 0 || topModels.length === 0) {
    return <span style={{ color: '#475569', fontSize: '0.85rem' }}>No data</span>;
  }

  const colTemplate = `1fr repeat(${topModels.length}, 3.2rem)`;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      {/* Header row: model names */}
      <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: '0.2rem', marginBottom: '0.15rem' }}>
        <div />
        {topModels.map((m) => (
          <div
            key={m}
            style={{
              fontSize: '0.58rem',
              color: '#64748b',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              padding: '0 0.1rem',
            }}
            title={m}
          >
            {m.length > 7 ? m.slice(0, 6) + '…' : m}
          </div>
        ))}
      </div>

      {/* Data rows: one per category */}
      {categories.map((cat) => (
        <div key={cat} style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: '0.2rem' }}>
          {/* Category label */}
          <div
            style={{
              fontSize: '0.63rem',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingRight: '0.25rem',
            }}
            title={cat}
          >
            {cat.length > 14 ? cat.slice(0, 13) + '…' : cat}
          </div>
          {/* Score cells */}
          {topModels.map((m) => {
            const score = categoryData[cat]?.[m] ?? null;
            return (
              <div
                key={m}
                style={{
                  background: score !== null ? heatmapCellBg(score) : 'rgba(15,23,42,0.4)',
                  borderRadius: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.58rem',
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#f1f5f9',
                  padding: '0.28rem 0',
                  border: '1px solid rgba(51,65,85,0.2)',
                }}
              >
                {score !== null ? Math.round(score * 100) + '%' : '—'}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Card preview: Task mini table ────────────────────────────────────────────
interface TaskPreviewProps {
  taskMatrix: ReturnType<typeof useDataContext>['taskMatrix'];
  topModelShortName: string;
}

function TaskPreview({ taskMatrix, topModelShortName }: TaskPreviewProps) {
  const rows = taskMatrix.slice(0, 5);

  if (rows.length === 0) {
    return <span style={{ color: '#475569', fontSize: '0.85rem' }}>No data</span>;
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {rows.map((row) => {
        const rawScore = topModelShortName ? (row[topModelShortName] as number | undefined) : undefined;
        const score = typeof rawScore === 'number' && isFinite(rawScore) ? rawScore : null;
        const label = row.task_id.length > 22 ? row.task_id.slice(0, 21) + '…' : row.task_id;

        return (
          <div
            key={row.task_id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.6rem',
              borderRadius: '0.45rem',
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(51,65,85,0.3)',
            }}
          >
            {/* Score dot */}
            <div
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: score !== null ? getScoreColor(score) : '#334155',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                fontSize: '0.72rem',
                color: '#94a3b8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
            {/* Score — right-aligned, tabular */}
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
                fontVariantNumeric: 'tabular-nums',
                color: score !== null ? getScoreColor(score) : '#334155',
                flexShrink: 0,
                textAlign: 'right',
                minWidth: '3rem',
              }}
            >
              {score !== null ? formatScore(score) : 'N/A'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Card preview: Efficiency stats ──────────────────────────────────────────
interface EfficiencyPreviewProps {
  efficiencyData: ReturnType<typeof useDataContext>['efficiencyData'];
}

function EfficiencyPreview({ efficiencyData }: EfficiencyPreviewProps) {
  if (efficiencyData.length === 0) {
    return <span style={{ color: '#475569', fontSize: '0.85rem' }}>No data</span>;
  }

  const totalTime = efficiencyData.reduce((s, e) => s + e.total_execution_time, 0);
  const avgTasks =
    efficiencyData.length > 0
      ? efficiencyData.reduce((s, e) => s + e.task_count, 0) / efficiencyData.length
      : 0;
  const totalRuns = efficiencyData.reduce((s, e) => s + e.task_count, 0);

  const stats = [
    { label: 'Total Exec Time', value: formatTime(totalTime), color: '#38bdf8' },
    { label: 'Avg Tasks / Model', value: Math.round(avgTasks).toString(), color: '#a78bfa' },
    { label: 'Total Task Runs', value: formatNumber(totalRuns), color: '#34d399' },
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            padding: '0.6rem 0.9rem',
            borderRadius: '0.6rem',
            background: 'rgba(15,23,42,0.5)',
            border: `1px solid ${s.color}22`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem',
          }}
        >
          <div
            style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
              fontVariantNumeric: 'tabular-nums',
              color: s.color,
              lineHeight: 1.1,
            }}
          >
            {s.value}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Overview Page ─────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { reports, categoryData, taskMatrix, efficiencyData, loading } = useDataContext();

  if (loading) {
    return (
      <motion.div {...pageTransition}>
        <Spinner />
      </motion.div>
    );
  }

  const topReport = reports[0] ?? null;
  const topModelShortName = topReport ? topReport.model.replace('copilot-proxy/', '') : '';

  return (
    <motion.div
      {...pageTransition}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
    >
      {/* Page heading */}
      <div>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.35rem',
            background: 'linear-gradient(90deg, #f1f5f9 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Benchmark Overview
        </h2>
        <p style={{ color: '#475569', fontSize: '0.875rem' }}>
          {reports.length} model{reports.length !== 1 ? 's' : ''} evaluated — select a section to explore
        </p>
      </div>

      {/* Cards row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}
      >
        {/* Card 1 — Leaderboard */}
        <SectionCard
          layoutId="section-leaderboard"
          title="得分榜单 · Leaderboard"
          description="Ranked model performance overview"
          icon={<TrophyIcon />}
          to="/leaderboard"
        >
          <LeaderboardPreview reports={reports} />
        </SectionCard>

        {/* Card 2 — Category Comparison */}
        <SectionCard
          layoutId="section-category"
          title="类别对比 · Category"
          description="Score heatmap across top models"
          icon={<GridIcon />}
          to="/category"
        >
          <CategoryPreview categoryData={categoryData} reports={reports} />
        </SectionCard>

        {/* Card 3 — Task Comparison */}
        <SectionCard
          layoutId="section-tasks"
          title="任务对比 · Tasks"
          description="Task-level score breakdown"
          icon={<TableIcon />}
          to="/tasks"
        >
          <TaskPreview taskMatrix={taskMatrix} topModelShortName={topModelShortName} />
        </SectionCard>

        {/* Card 4 — Efficiency */}
        <SectionCard
          layoutId="section-efficiency"
          title="效率指标 · Efficiency"
          description="Execution time, tokens & cost"
          icon={<ClockIcon />}
          to="/efficiency"
        >
          <EfficiencyPreview efficiencyData={efficiencyData} />
        </SectionCard>
      </div>
    </motion.div>
  );
}
