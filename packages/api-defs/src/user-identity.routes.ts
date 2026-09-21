import { userIdentityDtoSchemas } from '@mediconcen_coding_test/dtos'
import { z } from 'zod'
import type { Routes } from './routes.ts'

const emptySchema = z.object({})

export const userIdentityRoutes = {
  basePath: 'user-identities',
  endpoints: {
    getAndCreateIfNotExist: {
      method: 'POST',
      path: '/',
      httpCode: 200,
      summary:
        'Get a userID for an id1 and id2 pair, creating it if it does not exist',
      schemas: {
        params: emptySchema,
        query: emptySchema,
        body: userIdentityDtoSchemas.getAndCreateIfNotExistRequest,
        response: userIdentityDtoSchemas.getAndCreateIfNotExistResponse,
      },
      examples: {
        body: { id1: 'ABC123', id2: 'XYZ456' },
        response: { userID: '550e8400-e29b-41d4-a716-446655440000' },
      },
    },
  },
} as const satisfies Routes
