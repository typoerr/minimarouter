import regexparam from 'regexparam'
import qs from 'querystringify'

/* ------------------------------------------------------ */
/*                       Util Types                       */
/* ------------------------------------------------------ */
type Diff<T extends object, U extends object> = Pick<T, Exclude<keyof T, keyof U>>

type Assign<T extends object, U extends object> = Diff<T, U> & U

type PartialMap<T = any> = Partial<{
  [k: string]: T
}>

/* ------------------------------------------------------ */
/*                       Custom Error                      */
/* ------------------------------------------------------ */
export class NotFoundError extends Error {
  status = 404
  pathname: string
  method?: string
  constructor(pathname: string, method?: string) {
    super('404 - Not Found')
    this.name = this.constructor.name
    this.pathname = pathname
    this.method = method
  }
}

/* ------------------------------------------------------ */
/*                      Params parser                     */
/* ------------------------------------------------------ */
export function params(path: string, result: { keys: string[]; pattern: RegExp }) {
  const ret: MatchContext['params'] = {}
  const match = result.pattern.exec(path)
  if (!match) {
    return ret
  }
  for (let i = 0; i < match.keys.length; i++) {
    ret[result.keys[i]] = match[++i]
  }
  return ret
}

/* ------------------------------------------------------ */
/*                   Route Context Types                  */
/* ------------------------------------------------------ */
export interface MatchContext {
  params: PartialMap<string>
  query: PartialMap<string>
}

export interface LookUpHint {
  pathname: string
  search?: string
  method?: string
}

export type HandlerContext<T extends object> = Assign<Assign<T, LookUpHint>, MatchContext>

export interface RouteHandler<T extends object, U> {
  (ctx: HandlerContext<T>): U
}

export interface Route<T extends object, U> {
  path: string
  method?: string
  handler: (ctx: HandlerContext<T>) => U
}

export type ResolveContext<T extends object> = Assign<T, LookUpHint>

/* ------------------------------------------------------ */
/*                         Router                         */
/* ------------------------------------------------------ */
export function resolve<T extends object, U>(routes: Route<T, U>[], ctx: ResolveContext<T>) {
  return new Promise<U>((_resolve, reject) => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      if (
        route.method === '*' ||
        (route.method || '').toLowerCase() === (ctx.method || '').toLowerCase()
      ) {
        const r = regexparam(route.path)
        if (r.pattern.test(ctx.pathname)) {
          const hc = { ...ctx, params: params(route.path, r), query: qs.parse(ctx.search || '') }
          return _resolve(route.handler(hc))
        }
      }
    }
    return reject(new NotFoundError(ctx.pathname, ctx.method))
  })
}
