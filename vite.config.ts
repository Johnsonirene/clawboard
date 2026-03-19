import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function externalDataPlugin(dataDir: string): Plugin {
  return {
    name: 'external-data',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const filePath = path.join(dataDir, (req as { url?: string }).url || '')
        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) return next()
          res.setHeader('Content-Type', 'application/json')
          fs.createReadStream(filePath).pipe(res)
        })
      })
    },
    closeBundle() {
      if (!process.env.DATA_DIR) return
      const outDataDir = path.join(__dirname, 'dist', 'data')
      fs.mkdirSync(outDataDir, { recursive: true })
      for (const file of fs.readdirSync(dataDir)) {
        if (file.endsWith('.json')) {
          fs.copyFileSync(path.join(dataDir, file), path.join(outDataDir, file))
        }
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dataDir = env.DATA_DIR
    ? path.resolve(env.DATA_DIR)
    : path.join(__dirname, 'public', 'data')

  return {
    plugins: [react(), tailwindcss(), externalDataPlugin(dataDir)],
    server: { port: 5173 },
  }
})
