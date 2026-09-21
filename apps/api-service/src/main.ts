import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ConfigService } from '@nestjs/config'
import { Environment } from './config/env-schema.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService<Environment, true>)

  await app.listen(configService.get('port'))
}
await bootstrap()
