import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDataContext } from '../App';
import { getModelColor } from '../utils/colors';
import { formatScore } from '../utils/format';

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

type TabId = 'radar' | 'bar' | 'heatmap';

const TABS: { id: TabId; label: string }[] = [
  { id: 'radar', label: 'Radar Chart' },
  { id: 'bar', label: 'Bar Chart' },
  { id: 'heatmap', label: 'Heatmap' },
];

// Interpolate a score (0–1) across rose → amber → emerald
function scoreToHeatColor(score: number): string {
  const s = Math.max(0, Math.min(1, score));

  // rose: [244, 63, 94]  amber: [245, 158, 11]  emerald: [16, 185, 129]
  let r: number, g: number, b: number;

  if (s < 0.5) {
    // rose -> amber
    const t = s / 0.5;
    r = Math.round(244 + (245 - 244) * t);
    g = Math.round(63 + (158 - 63) * t);
    b = Math.round(94 + (11 - 94) * t);
  } else {
    // amber -> emerald
    const t = (s - 0.5) / 0.5;
    r = Math.round(245 + (16 - 245) * t);
    g = Math.round(158 + (185 - 158) * t);
    b = Math.round(11 + (129 - 11) * t);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

interface HeatmapTooltip {
  visible: boolean;
  score: number;
  model: string;
  category: string;
  x: number;
  y: number;
}

export default function CategoryPage() {
  const { categoryData, loading } = useDataContext();
  const [activeTab, setActiveTab] = useState<TabId>('radar');
  const [heatTooltip, setHeatTooltip] = useState<HeatmapTooltip>({
    visible: false,
    score: 0,
    model: '',
    category: '',
    x: 0,
    y: 0,
  });
  const heatGridRef = useRef<HTMLDivElement>(null);

  // Derive sorted categories and models
  const categories = Object.keys(categoryData).sort();
  const modelSet = new Set<string>();
  for (const cat of categories) {
    for (const m of Object.keys(categoryData[cat])) {
      modelSet.add(m);
    }
  }
  const models = Array.from(modelSet);

  // ── Radar data ──────────────────────────────────────────────────────────────
  // Shape: [{ category: 'X', ModelA: 0.8, ModelB: 0.6 }, …]
  const radarData = categories.map((cat) => {
    const row: Record<string, string | number> = { category: cat };
    for (const m of models) {
      row[m] = Number(((categoryData[cat][m] ?? 0) * 100).toFixed(1));
    }
    return row;
  });

  // ── Bar data ─────────────────────────────────────────────────────────────────
  const barData = categories.map((cat) => {
    const row: Record<string, string | number> = { category: cat };
    for (const m of models) {
      row[m] = Number(((categoryData[cat][m] ?? 0) * 100).toFixed(1));
    }
    return row;
  });

  // ── Custom tooltip for bar chart ─────────────────────────────────────────────
  const BarTooltipContent = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/95 px-3 py-2 shadow-xl text-sm">
        <p className="font-semibold text-slate-200 mb-1">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-slate-300">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate max-w-[140px]">{entry.name}</span>
            <span className="ml-auto font-mono text-slate-100">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  };

  // ── Loading / empty states ───────────────────────────────────────────────────
  const isEmpty = !loading && categories.length === 0;

  return (
    <motion.div {...pageTransition} className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Category Comparison
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          Model performance broken down by task category
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-slate-700/60 relative">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.span
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 animate-pulse">Loading category data…</div>
        </div>
      )}

      {/* Empty */}
      {isEmpty && (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">No category data available.</p>
        </div>
      )}

      {/* ── Tab 1: Radar Chart ────────────────────────────────────────────────── */}
      {!loading && !isEmpty && activeTab === 'radar' && (
        <motion.div
          key="radar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6"
        >
          <h2 className="text-base font-semibold text-slate-200 mb-4">
            Radar — scores per category (%)
          </h2>
          <ResponsiveContainer width="100%" height={520}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickCount={6}
              />
              {models.map((model, idx) => (
                <Radar
                  key={model}
                  name={model}
                  dataKey={model}
                  stroke={getModelColor(idx)}
                  fill={getModelColor(idx)}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
              <Legend
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Tab 2: Grouped Bar Chart ──────────────────────────────────────────── */}
      {!loading && !isEmpty && activeTab === 'bar' && (
        <motion.div
          key="bar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6"
        >
          <h2 className="text-base font-semibold text-slate-200 mb-4">
            Grouped bars — scores per category (%)
          </h2>
          <ResponsiveContainer width="100%" height={480}>
            <BarChart
              data={barData}
              margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
              barCategoryGap="20%"
              barGap={2}
            >
              <CartesianGrid vertical={false} stroke="#1e293b" />
              <XAxis
                dataKey="category"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
              <Legend
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '8px' }}
              />
              {models.map((model, idx) => (
                <Bar
                  key={model}
                  dataKey={model}
                  fill={getModelColor(idx)}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Tab 3: Heatmap ────────────────────────────────────────────────────── */}
      {!loading && !isEmpty && activeTab === 'heatmap' && (
        <motion.div
          key="heatmap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6"
        >
          <h2 className="text-base font-semibold text-slate-200 mb-2">
            Heatmap — score intensity by model &amp; category
          </h2>
          <p className="text-xs text-slate-500 mb-5">Hover a cell to see the exact score.</p>

          {/* Color legend */}
          <div className="flex items-center gap-3 mb-5 text-xs text-slate-400">
            <span>Low</span>
            <div
              className="h-3 rounded flex-1 max-w-[200px]"
              style={{
                background:
                  'linear-gradient(to right, rgb(244,63,94), rgb(245,158,11), rgb(16,185,129))',
              }}
            />
            <span>High</span>
          </div>

          <div className="overflow-x-auto">
            <div ref={heatGridRef} className="relative inline-block min-w-full">
              {/* Grid table */}
              <table className="border-separate border-spacing-1">
                <thead>
                  <tr>
                    {/* Top-left corner cell */}
                    <th className="w-36 min-w-[9rem]" />
                    {categories.map((cat) => (
                      <th
                        key={cat}
                        className="px-2 pb-2 text-xs font-medium text-slate-400 whitespace-nowrap text-center"
                        style={{ minWidth: '80px' }}
                      >
                        {cat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.map((model, mIdx) => (
                    <tr key={model}>
                      {/* Row header */}
                      <td className="pr-3 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-300 whitespace-nowrap"
                          title={model}
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getModelColor(mIdx) }}
                          />
                          <span className="truncate max-w-[8rem]">{model}</span>
                        </div>
                      </td>
                      {/* Score cells */}
                      {categories.map((cat) => {
                        const score = categoryData[cat]?.[model] ?? NaN;
                        const valid = isFinite(score);
                        const bg = valid ? scoreToHeatColor(score) : '#1e293b';
                        const textColor =
                          valid && score > 0.55 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.7)';

                        return (
                          <td key={cat} className="p-0">
                            <div
                              className="rounded-md cursor-default transition-transform hover:scale-105 hover:z-10 relative flex items-center justify-center text-xs font-semibold"
                              style={{
                                width: '80px',
                                height: '44px',
                                backgroundColor: bg,
                                color: textColor,
                              }}
                              onMouseEnter={(e) => {
                                if (!valid) return;
                                const rect = (e.target as HTMLElement)
                                  .closest('td')!
                                  .getBoundingClientRect();
                                const gridRect =
                                  heatGridRef.current!.getBoundingClientRect();
                                setHeatTooltip({
                                  visible: true,
                                  score,
                                  model,
                                  category: cat,
                                  x: rect.left - gridRect.left + rect.width / 2,
                                  y: rect.top - gridRect.top - 8,
                                });
                              }}
                              onMouseLeave={() =>
                                setHeatTooltip((t) => ({ ...t, visible: false }))
                              }
                            >
                              {valid ? formatScore(score) : '—'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Floating tooltip */}
              {heatTooltip.visible && (
                <div
                  className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-600 bg-slate-800/95 px-3 py-2 shadow-xl text-xs"
                  style={{ left: heatTooltip.x, top: heatTooltip.y }}
                >
                  <p className="font-semibold text-slate-200">{heatTooltip.model}</p>
                  <p className="text-slate-400">{heatTooltip.category}</p>
                  <p className="font-mono text-sky-300 mt-0.5">
                    {formatScore(heatTooltip.score)}
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
