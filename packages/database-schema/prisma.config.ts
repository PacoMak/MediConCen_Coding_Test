import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('src'),
  migrations: {
    path: path.join('src', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
