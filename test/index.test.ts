import * as r from '../src/index'

test('normalize', () => {
  const handler = jest.fn()
  const routes = r._normalize([
    { method: 'GET', path: '/', handler },
    {
      path: '/nest',
      children: [
        //
        { path: '/', method: 'GET', handler },
        { path: '/:id', method: 'POST', handler },
        {
          path: '/deep',
          children: [
            //
            { path: '/path', method: 'GET', handler },
            { path: '/path/:id', method: 'POST', handler },
          ],
        },
      ],
    },
    { method: 'GET', path: '/', handler },
  ])

  expect(routes).toStrictEqual([
    { path: '/', method: 'GET', handler },
    { path: '/nest', method: 'GET', handler },
    { path: '/nest/:id', method: 'POST', handler },
    { path: '/nest/deep/path', method: 'GET', handler },
    // it should remove tail slash
    { path: '/nest/deep/path/:id', method: 'POST', handler },
    { path: '/', method: 'GET', handler },
  ])
})

test('RouteError', () => {
  const err = new r.RouteError({ pathname: '/path', method: 'GET' })
  expect(err).toBeInstanceOf(r.RouteError)
  expect(err.status).toBe(404)
  expect(err.pathname).toBe('/path')
  expect(err.method).toBe('GET')
  expect(err.message).toBe('Route not found.')
})

describe('router', () => {
  type Context = { hello: string }
  const handler = jest.fn((ctx: r.HandlerContext<Context>) => {
    expect(ctx.params.id).toBe('1')
    expect(ctx.query).toEqual({ q: 'hello' })
    expect(ctx.hello).toBe('hello')
    expect(ctx.search).toBe('?q=hello')
    expect(ctx.pathname).toBe('/path/1')
    expect(ctx.method).toBe('POST')
    return ctx.hello
  })
  const routes = [
    {
      path: '/path',
      children: [{ path: '/:id', method: 'POST', handler }],
    },
  ]
  const ctx: Context = { hello: 'hello' }
  const lookup = r.router<typeof ctx, string>(routes)

  test('match route', async () => {
    const hint = { pathname: '/path/1', method: 'POST', search: '?q=hello' }
    const result = await lookup({ ...ctx, ...hint })
    expect(result).toBe('hello')
    expect(handler).toBeCalledTimes(1)
  })

  test('unmatch route', async () => {
    const hint = { pathname: '/path/1', method: 'POST', search: '?q=hello' }
    try {
      lookup({ ...ctx, ...hint })
    } catch (err) {
      expect(err).toBeInstanceOf(r.RouteError)
    }
  })
})
