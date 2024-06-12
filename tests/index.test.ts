import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, it } from 'vitest'
import { compileFile, makeCompile, splitFile } from '../src/compilers'
import { splitPrefix } from '../src/constants'

it('it compiles and splits', async () => {
  // get the list of files from the /test-files directory
  const files = await readdir(path.resolve(__dirname, './test-files'))
  for (const file of files) {
    console.log('Testing:', file)
    await compileTestFile({ file })
    await splitTestFile({ file })
  }
})

async function compileTestFile(opts: { file: string }) {
  const code = (
    await readFile(path.resolve(__dirname, `./test-files/${opts.file}`))
  )
    .toString()

  const filename = opts.file.replace(__dirname, '')

  const result = await compileFile({
    code,
    compile: makeCompile({
      root: './test-files',
    }),
    filename,
  })

  // correct line endings created from windows
  const output = result.code.replaceAll('\r\n', '\n')

  await expect(output).toMatchFileSnapshot(`./snapshots/${filename}`)
}

async function splitTestFile(opts: { file: string }) {
  const code = (
    await readFile(path.resolve(__dirname, `./test-files/${opts.file}`))
  ).toString()

  const filename = opts.file.replace(__dirname, '')

  const result = await splitFile({
    code,
    compile: makeCompile({
      root: './test-files',
    }),
    filename: `${filename}?${splitPrefix}`,
  })

  // correct line endings created from windows
  const output = result.code.replaceAll('\r\n', '\n')

  await expect(output).toMatchFileSnapshot(
    `./snapshots/${filename.replace('.tsx', '')}@split.tsx`,
  )
}
