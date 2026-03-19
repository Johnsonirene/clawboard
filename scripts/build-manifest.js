import { readdirSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local (same files Vite reads, simple key=value parser)
for (const envFile of ['.env', '.env.local']) {
  try {
    const lines = readFileSync(join(__dirname, '..', envFile), 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!(key in process.env)) process.env[key] = val
    }
  } catch { /* file not found, skip */ }
}

const dataDir = process.env.DATA_DIR
  ? resolve(process.env.DATA_DIR)
  : join(__dirname, '..', 'public', 'data')

const files = readdirSync(dataDir)
  .filter(f => f.endsWith('.json') && f !== 'manifest.json')
  .sort()

writeFileSync(
  join(dataDir, 'manifest.json'),
  JSON.stringify({ files }, null, 2)
)

console.log(`manifest.json generated with ${files.length} files (from ${dataDir})`)
