import match from 'my-way'
import qs from 'querystringify'

type Diff<T extends object, U extends object> = Pick<T, Exclude<keyof T, keyof U>>

type Assign<T extends object, U extends object> = Diff<T, U> & U

type PartialMap<T = any> = Partial<{
  [k: string]: T
}>

export type MatchContext = {
  params: PartialMap<string>
  query: PartialMap<string>
}

export type LookUpHint = {
  pathname: string
  search?: string
  method?: string
}

export type HandlerContext<T extends object> = Assign<Assign<T, LookUpHint>, MatchContext>

export type RouteHandler<T extends object, U> = (ctx: HandlerContext<T>) => U

export type ParentRoute<T extends object, U> = {
  path: string
  children: RouteTree<T, U>[]
}

export type Route<T extends object, U> = {
  path: string
  method: string
  handler: (ctx: HandlerContext<T>) => U
}

export type RouteTree<T extends object, U> = ParentRoute<T, U> | Route<T, U>

/**
 * 404 NotFound Error
 */
export class RouteError extends Error {
  status = 404
  pathname: string
  method?: string
  constructor(hint: LookUpHint) {
    super('Route not found.')
    this.name = this.constructor.name
    this.pathname = hint.pathname
    this.method = hint.method
  }
}

/**
 * Flatten RouteTree
 * RouteTree[] -> Route[]
 */
export function _normalize<T extends object, U>(
  routes: RouteTree<T, U>[],
  parent = '',
): Route<T, U>[] {
  const ret: Route<T, U>[] = []

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    if ('children' in route) {
      const r = _normalize(route.children, parent + route.path)
      Array.prototype.push.apply(ret, r)
    } else {
      const path = (parent + route.path).replace(/\/$/g, '') || '/'
      ret.push({ ...route, path })
    }
  }

  return ret
}

/**
 * Create Router
 */
export function router<T extends object, U>(tree: RouteTree<T, U>[]) {
  const routes = _normalize(tree)
  return function lookup(ctx: Assign<T, LookUpHint>) {
    return new Promise<U>((resolve, reject) => {
      const { pathname, method = 'GET', search = '' } = ctx

      for (const route of routes) {
        if (route.method.toUpperCase() === method.toUpperCase()) {
          const params = match(route.path, pathname)
          if (!params) continue
          const mc: MatchContext = { params, query: qs.parse(search) }
          const hc: HandlerContext<T> = { ...ctx, ...mc }
          return resolve(route.handler(hc))
        }
      }

      return reject(new RouteError(ctx))
    })
  }
}

/**
 * Helper function for route creating
 *
 * path('MEHTOD', '/path', handler): Route
 * path('/path', handler): Route
 * path('/path', [...children]): ParentRoot
 */
interface RouteFunction {
  <T extends object, U>(method: string, path: string, handler: RouteHandler<T, U>): Route<T, U>
  <T extends object, U>(path: string, handler: RouteHandler<T, U>): Route<T, U>
  <T extends object, U>(path: string, children: RouteTree<T, U>[]): ParentRoute<T, U>
}

export const route = ((...args: any[]): RouteTree<any, any> => {
  const [a, b] = args
  const length = args.length
  const last = args[length - 1]
  const path: string = length < 3 ? a : b
  const method: string = length < 3 ? 'GET' : a
  return Array.isArray(last) ? { path, children: last } : { path, method, handler: last }
}) as RouteFunction
