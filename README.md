# unplugin-tanstack-router

> [!WARNING]
> This plugin is deprecated in favor of the official package which is now also based on unplugin: [@tanstack/router-plugin](https://github.com/TanStack/router/tree/main/packages/router-plugin)
>
> This will no longer be updated/maintained.

[![NPM version](https://img.shields.io/npm/v/unplugin-tanstack-router?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-tanstack-router)

Build plugin for route generation and file splitting built on [unplugin](https://github.com/unjs/unplugin).

## Install

```bash
npm i unplugin-tanstack-router
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import TanStackRouter from 'unplugin-tanstack-router/vite'

export default defineConfig({
  plugins: [
    TanStackRouter({ /* options */ }),
  ],
})
```

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import TanStackRouter from 'unplugin-tanstack-router/rollup'

export default {
  plugins: [
    TanStackRouter({ /* options */ }),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-tanstack-router/webpack')({ /* options */ })
  ]
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    ['unplugin-tanstack-router/nuxt', { /* options */ }],
  ],
})
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-tanstack-router/webpack')({ /* options */ }),
    ],
  },
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import TanStackRouter from 'unplugin-tanstack-router/esbuild'

build({
  plugins: [TanStackRouter()],
})
```

<br></details>

## Development

To test your plugin, run: `pnpm run dev`
To release a new version, run: `pnpm run release`
