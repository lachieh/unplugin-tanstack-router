import process from 'node:process'
import { isAbsolute, join, normalize, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import {
  generator,
  getConfig as getGeneratorConfig,
} from '@tanstack/router-generator'
import { type Config, configSchema } from './types'
import { compileFile, makeCompile, splitFile } from './compilers'
import { splitPrefix } from './constants'

let lock = false

const CONFIG_FILE_NAME = 'tsr.config.json'
const debug = Boolean(process.env.TSR_VITE_DEBUG)

async function getConfig(inlineConfig: Partial<Config>, root: string) {
  const config = await getGeneratorConfig(inlineConfig, root)

  return configSchema.parse({ ...config, ...inlineConfig })
}

function fileIsInRoutesDirectory(filePath: string, routesDirectory: string) {
  const routesDirectoryPath = isAbsolute(routesDirectory)
    ? routesDirectory
    : join(process.cwd(), routesDirectory)

  return filePath.startsWith(routesDirectoryPath)
}

export const TanStackRouterUnpluginGenerator: UnpluginFactory<Partial<Config>, false> = (inlineConfig = {}) => {
  let ROOT: string = process.cwd()
  let userConfig: Config

  const generate = async () => {
    if (lock)
      return

    lock = true
    try {
      await generator(userConfig)
    }
    catch (err) {
      console.error(err)
    }
    lock = false
  }

  const handleFile = async (
    file: string,
    event: 'create' | 'update' | 'delete',
  ) => {
    const filePath = normalize(file)

    if (filePath === join(ROOT, CONFIG_FILE_NAME)) {
      userConfig = await getConfig(inlineConfig, ROOT)
      return
    }

    if (
      event === 'update'
      && filePath === resolve(userConfig.generatedRouteTree)
    ) {
      // skip generating routes if the generated route tree is updated
      return
    }

    if (fileIsInRoutesDirectory(filePath, userConfig.routesDirectory))
      await generate()
  }

  return {
    name: 'tanstack-router-generator',
    buildStart: async () => {
      ROOT = process.cwd()
      userConfig = await getConfig(inlineConfig, ROOT)
      console.log('Generate 🦆')
      await generate()
    },
    watchChange: async (file, context) => {
      if (['create', 'update', 'delete'].includes(context.event)) {
        console.log('File changed: ', file, context.event)
        await handleFile(file, context.event)
      }
    },
  }
}

export const TanStackRouterViteCodeSplitter: UnpluginFactory<Partial<Config>, false> = (
  inlineConfig: Partial<Config> = {},
) => {
  const ROOT: string = process.cwd()
  let userConfig: Config

  return {
    name: 'vite-plugin-tanstack-router-code-splitter',
    enforce: 'pre',
    async buildStart() {
      userConfig = await getConfig(inlineConfig, ROOT)
    },
    transformInclude(id) {
      return userConfig.experimental?.enableCodeSplitting && /.*\.(?:js|ts)x?$/.test(id)
    },
    resolveId(source) {
      if (!userConfig.experimental?.enableCodeSplitting)
        return null

      if (source.startsWith(`${splitPrefix}:`))
        return source.replace(`${splitPrefix}:`, '')

      return null
    },
    async transform(code, id) {
      const url = pathToFileURL(id)
      url.searchParams.delete('v')
      id = fileURLToPath(url).replace(/\\/g, '/')

      const compile = makeCompile({
        root: ROOT,
      })

      if (id.includes(splitPrefix)) {
        if (debug)
          console.info('Splitting route: ', id)
        // const ref = new URLSearchParams(id.split('?')[1]).get('ref') || ''

        const compiled = await splitFile({
          code,
          compile,
          filename: id,
          // ref,
        })

        if (debug) {
          console.info('')
          console.info('Split Output')
          console.info('')
          console.info(compiled.code)
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
        }

        return compiled
      }
      else if (
        (fileIsInRoutesDirectory(id, userConfig.routesDirectory)
        && (code.includes('createRoute(')
        || code.includes('createFileRoute(')))
        || code.includes('createServerFn')
      ) {
        if (code.includes('@react-refresh')) {
          throw new Error(
            `We detected that the '@vitejs/plugin-react' was passed before '@tanstack/router-vite-plugin'. Please make sure that '@tanstack/router-vite-plugin' is passed before '@vitejs/plugin-react' and try again: 
e.g.

plugins: [
  TanStackRouterVite(), // Place this before viteReact()
  viteReact(),
]
`,
          )
        }

        if (debug)
          console.info('Handling createRoute: ', id)
        const compiled = await compileFile({
          code,
          compile,
          filename: id,
        })

        if (debug) {
          console.info('')
          console.info('Compiled Output')
          console.info('')
          console.info(compiled.code)
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
          console.info('')
        }

        return compiled
      }

      return null
    },
  }
}

export const unpluginFactory: UnpluginFactory<Partial<Config>> = (inlineConfig, meta) => ([
  TanStackRouterUnpluginGenerator(inlineConfig, meta),
  TanStackRouterViteCodeSplitter(inlineConfig, meta),
])

export const unplugin = /* #__PURE__ */ createUnplugin<Partial<Config>>((inlineConfig, meta) => ([
  TanStackRouterUnpluginGenerator(inlineConfig, meta),
  TanStackRouterViteCodeSplitter(inlineConfig, meta),
]))

export default unplugin
