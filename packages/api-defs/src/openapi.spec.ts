import { describe, expect, it } from 'vitest'
import { toOpenApiDocument } from './openapi.ts'
import { userIdentityRoutes } from './user-identity.routes.ts'

describe('toOpenApiDocument', () => {
  const document = toOpenApiDocument(
    {
      title: 'User identity API',
      description: 'from api-defs',
      version: '0.0.1',
    },
    [userIdentityRoutes],
  )

  it('builds paths from route defs', () => {
    expect(document.openapi).toBe('3.1.0')
    expect(document.info.title).toBe('User identity API')
    expect(document.tags).toEqual([{ name: 'user-identities' }])
    expect(Object.keys(document.paths)).toEqual(['/user-identities'])
  })

  it('copies method, summary, body, and response from the endpoint', () => {
    const post = document.paths['/user-identities']?.post as {
      summary: string
      tags: string[]
      requestBody: {
        content: { 'application/json': { example: unknown; schema: unknown } }
      }
      responses: Record<
        string,
        { content: { 'application/json': { example: unknown } } }
      >
    }

    expect(post.tags).toEqual(['user-identities'])
    expect(post.summary).toBe(
      userIdentityRoutes.endpoints.getAndCreateIfNotExist.summary,
    )
    expect(post.requestBody.content['application/json'].example).toEqual(
      userIdentityRoutes.endpoints.getAndCreateIfNotExist.examples?.body,
    )
    expect(post.responses['200']?.content['application/json'].example).toEqual(
      userIdentityRoutes.endpoints.getAndCreateIfNotExist.examples?.response,
    )
  })
})
