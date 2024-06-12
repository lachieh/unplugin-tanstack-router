import antfu, { test } from '@antfu/eslint-config'

export default antfu(
  {},
  test({
    files: ['tests/**/*'],
  }),
  {
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: ['tests/snapshots/**/*'],
  },
)
