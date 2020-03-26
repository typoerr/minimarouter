# @typeoerr/router

## Install

```
npm i @typoerr/minimarouter
```

## Usage

[TOOD]

## Segments

See [amio/my-way: Robust path matcher in 738 bytes.](https://github.com/amio/my-way#segments)

## Example

```ts
import {route, router} from '@typoerr/minimarouter'

/**
 * route() is a shorthand method.
 *
  const routes = [
    {
      path: '/api',
      children: [
        {
          method: 'GET',
          path: '/'
          handler: (ctx) => {}
        },
        {
          method: 'POST',
          path: '/:id'
          handler: (ctx) => {}
        },
      ]
    }
  ]
*/
const routes = [
  route('/api', [
    route('GET', '/', (ctx) => {/*  */}),
    route('POST', '/:id', (ctx) => {/*  */}),
  ])
]


const lookup = router(routes)

lookup({pathname: '/api/1', method: 'POST', /* ...and other context for handler */})
  // Result is a return value by matched handler
  .then((result) => {/*  */})
  // Error is thrown when route is not found
  // err.status === 404
  .catch(err => {/*  */})
```