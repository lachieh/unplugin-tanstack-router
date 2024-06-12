import type { Config } from './types'

import unplugin from '.'

export default (config: Config) => ({
  name: 'unplugin-starter',
  hooks: {
    'astro:config:setup': async (astro: any) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(unplugin.vite(config))
    },
  },
})
