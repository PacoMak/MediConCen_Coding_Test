import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule } from '@nestjs/swagger'
import {
  healthRoutes,
  toOpenApiDocument,
  userIdentityRoutes,
} from '@mediconcen_coding_test/api-defs'
import { AppModule } from './app.module.js'
import type { Environment } from './config/env-schema.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService<Environment, true>)

  SwaggerModule.setup(
    'docs',
    app,
    toOpenApiDocument(
      {
        title: 'Mediconcen coding test',
        description: '',
        version: '0.0.1',
      },
      [healthRoutes, userIdentityRoutes],
    ),
  )

  await app.listen(configService.get('port'))
}
await bootstrap()
