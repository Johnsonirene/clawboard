/**
 * Format a score (0–1 range) as a percentage string.
 * Example: 0.85 -> "85.0%"
 */
export function formatScore(score: number): string {
  if (!isFinite(score)) return 'N/A';
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Format a duration in seconds as a human-readable string.
 * Example: 83 -> "1m 23s", 45 -> "45s"
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0s';
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (minutes === 0) {
    return `${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

/**
 * Format a large number in compact form.
 * Example: 1200 -> "1.2k", 3400000 -> "3.4M"
 */
export function formatNumber(n: number): string {
  if (!isFinite(n)) return 'N/A';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}k`;
  }
  return `${sign}${abs}`;
}

/**
 * Format a Unix timestamp as a date/time string.
 * Example: 1741870200 -> "2025-03-13 14:30"
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Strip the "copilot-proxy/" prefix from a model name.
 * Example: "copilot-proxy/qwen3.5-122b" -> "qwen3.5-122b"
 */
export function getShortModelName(model: string): string {
  if (!model) return model;
  const prefix = 'copilot-proxy/';
  if (model.startsWith(prefix)) {
    return model.slice(prefix.length);
  }
  return model;
}
