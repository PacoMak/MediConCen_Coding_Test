import type { z } from 'zod'

export type HttpMethod = 'GET' | 'POST'

export type Endpoint = {
  method: HttpMethod
  path: string
  httpCode: number
  summary: string
  schemas: {
    params: z.ZodType
    query: z.ZodType
    body: z.ZodType
    response: z.ZodType
  }
  examples?: {
    body?: unknown
    response?: unknown
  }
}

export type Routes = {
  basePath: string
  endpoints: Readonly<Record<string, Endpoint>>
}
