import { z } from 'zod'
import { configSchema as generatorConfigSchema } from '@tanstack/router-generator'

export const configSchema = generatorConfigSchema.extend({
  enableRouteGeneration: z.boolean().optional(),
  experimental: z
    .object({
      enableCodeSplitting: z.boolean().optional(),
    })
    .optional(),
})

export type Config = z.infer<typeof configSchema>
