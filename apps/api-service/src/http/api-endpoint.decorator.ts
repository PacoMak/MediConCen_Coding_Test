import {
  applyDecorators,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common'
import type {
  Endpoint,
  HttpMethod,
  Routes,
} from '@mediconcen_coding_test/api-defs'
import { ZodValidationPipe } from './zod-validation.pipe.js'

const methodDecorator = {
  GET: Get,
  POST: Post,
} satisfies Record<HttpMethod, (path?: string | string[]) => MethodDecorator>

export function ApiController(routes: Routes): ClassDecorator {
  return Controller(routes.basePath)
}

export function ApiEndpoint(endpoint: Endpoint): MethodDecorator {
  return applyDecorators(
    methodDecorator[endpoint.method](endpoint.path),
    HttpCode(endpoint.httpCode),
  )
}

export function EndpointBody(endpoint: Endpoint): ParameterDecorator {
  return Body(new ZodValidationPipe(endpoint.schemas.body))
}
