import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ConfigModule as NestJSConfigModule } from '@nestjs/config'
import { environmentSchema, parseEnv } from './env-schema.js'

const packageEnv = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../.env',
)

export const ConfigModule = NestJSConfigModule.forRoot({
  isGlobal: true,
  envFilePath: packageEnv,
  validate(config: Record<string, unknown>) {
    return environmentSchema.parse(parseEnv(config))
  },
  cache: true,
})
