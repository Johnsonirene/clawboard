import { readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'public', 'data')

const files = readdirSync(dataDir)
  .filter(f => f.endsWith('.json') && f !== 'manifest.json')
  .sort()

writeFileSync(
  join(dataDir, 'manifest.json'),
  JSON.stringify({ files }, null, 2)
)

console.log(`manifest.json generated with ${files.length} files`)
