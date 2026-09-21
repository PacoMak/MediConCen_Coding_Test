import { z } from 'zod'
import type { Endpoint, Routes } from './routes.ts'

export type OpenApiInfo = {
  title: string
  description?: string
  version: string
}

export type OpenApiDocument = {
  openapi: string
  info: OpenApiInfo
  tags: { name: string }[]
  paths: Record<string, Record<string, unknown>>
}

export function toOpenApiDocument(
  info: OpenApiInfo,
  routes: readonly Routes[],
): OpenApiDocument {
  const paths: OpenApiDocument['paths'] = {}
  const tags = routes.map((group) => ({ name: group.basePath }))

  for (const group of routes) {
    for (const endpoint of Object.values(group.endpoints)) {
      const path = joinPath(group.basePath, endpoint.path)
      const item = paths[path] ?? {}
      item[endpoint.method.toLowerCase()] = operation(group.basePath, endpoint)
      paths[path] = item
    }
  }

  return {
    openapi: '3.1.0',
    info,
    tags,
    paths,
  }
}

function operation(tag: string, endpoint: Endpoint) {
  const parameters = [
    ...parametersFromSchema(endpoint.schemas.params, 'path'),
    ...parametersFromSchema(endpoint.schemas.query, 'query'),
  ]

  return {
    tags: [tag],
    summary: endpoint.summary,
    ...(parameters.length > 0 ? { parameters } : {}),
    ...(endpoint.method === 'GET'
      ? {}
      : {
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: toOpenApiSchema(endpoint.schemas.body),
                ...(endpoint.examples?.body === undefined
                  ? {}
                  : { example: endpoint.examples.body }),
              },
            },
          },
        }),
    responses: {
      [String(endpoint.httpCode)]: {
        description: endpoint.summary,
        content: {
          'application/json': {
            schema: toOpenApiSchema(endpoint.schemas.response),
            ...(endpoint.examples?.response === undefined
              ? {}
              : { example: endpoint.examples.response }),
          },
        },
      },
    },
  }
}

function parametersFromSchema(
  schema: z.ZodType,
  location: 'path' | 'query',
): Array<Record<string, unknown>> {
  const json = toOpenApiSchema(schema)
  const properties = objectRecord(json.properties)
  if (properties === undefined || Object.keys(properties).length === 0) {
    return []
  }

  const required = new Set(
    Array.isArray(json.required) ? json.required.map(String) : [],
  )

  return Object.entries(properties).map(([name, prop]) => ({
    name,
    in: location,
    required: location === 'path' ? true : required.has(name),
    schema: prop,
  }))
}

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

function toOpenApiSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as {
    $schema?: string
  } & Record<string, unknown>
  const { $schema: _schema, ...openApiSchema } = jsonSchema
  return openApiSchema
}

function joinPath(basePath: string, path: string): string {
  const base = basePath.replace(/^\/+|\/+$/g, '')
  const rest = path.replace(/^\/+|\/+$/g, '')
  return `/${[base, rest].filter((part) => part.length > 0).join('/')}`
}
