import { healthResponseSchema } from '@mediconcen_coding_test/dtos'
import { z } from 'zod'
import type { Routes } from './routes.ts'

const emptySchema = z.object({})

export const healthRoutes = {
  basePath: 'health',
  endpoints: {
    getHealth: {
      method: 'GET',
      path: '/',
      httpCode: 200,
      summary: 'Liveness and dependency health',
      schemas: {
        params: emptySchema,
        query: emptySchema,
        body: emptySchema,
        response: healthResponseSchema,
      },
      examples: {
        response: {
          env: 'LOCAL',
          status: 'ok',
          database: 'ok',
          redis: 'ok',
        },
      },
    },
  },
} as const satisfies Routes
