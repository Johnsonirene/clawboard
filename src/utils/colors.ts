/**
 * A palette of 10 distinct colors for model series in charts.
 */
export const MODEL_COLORS: string[] = [
  '#38bdf8', // sky-400
  '#a78bfa', // violet-400
  '#fbbf24', // amber-400
  '#34d399', // emerald-400
  '#fb7185', // rose-400
  '#22d3ee', // cyan-400
  '#f97316', // orange-500
  '#818cf8', // indigo-400
  '#2dd4bf', // teal-400
  '#e879f9', // fuchsia-400
];

/**
 * Named rank colors for leaderboard display.
 */
export const RANK_COLORS = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
} as const;

/**
 * Return a color based on a score (0–1 range):
 * - > 0.7: emerald green
 * - > 0.4: amber yellow
 * - else: rose red
 */
export function getScoreColor(score: number): string {
  if (score > 0.7) return '#10b981'; // emerald-500
  if (score > 0.4) return '#f59e0b'; // amber-500
  return '#f43f5e'; // rose-500
}

/**
 * Return a model color by index, cycling through MODEL_COLORS.
 */
export function getModelColor(index: number): string {
  return MODEL_COLORS[index % MODEL_COLORS.length];
}
