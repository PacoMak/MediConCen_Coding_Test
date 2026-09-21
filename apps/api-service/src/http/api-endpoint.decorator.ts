import {
  applyDecorators,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type {
  Endpoint,
  HttpMethod,
  Routes,
} from '@mediconcen_coding_test/api-defs'
import { z } from 'zod'
import { ZodValidationPipe } from './zod-validation.pipe.js'

const methodDecorator = {
  GET: Get,
  POST: Post,
} satisfies Record<HttpMethod, (path?: string | string[]) => MethodDecorator>

function toOpenApiSchema(schema: z.ZodType, example?: unknown) {
  const jsonSchema = z.toJSONSchema(schema) as {
    $schema?: string
  } & Record<string, unknown>
  const { $schema: _schema, ...openApiSchema } = jsonSchema

  if (example !== undefined) {
    return { ...openApiSchema, example }
  }

  return openApiSchema
}

export function ApiController(routes: Routes): ClassDecorator {
  return applyDecorators(Controller(routes.basePath), ApiTags(routes.basePath))
}

export function ApiEndpoint(endpoint: Endpoint): MethodDecorator {
  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [
    methodDecorator[endpoint.method](endpoint.path),
    HttpCode(endpoint.httpCode),
    ApiOperation({ summary: endpoint.summary }),
    ApiResponse({
      status: endpoint.httpCode,
      schema: toOpenApiSchema(
        endpoint.schemas.response,
        endpoint.examples?.response,
      ),
    }),
  ]

  if (endpoint.method !== 'GET') {
    decorators.push(
      ApiBody({
        schema: toOpenApiSchema(endpoint.schemas.body, endpoint.examples?.body),
      }),
    )
  }

  return applyDecorators(...decorators)
}

export function EndpointBody(endpoint: Endpoint): ParameterDecorator {
  return Body(new ZodValidationPipe(endpoint.schemas.body))
}
