import process from 'node:process'
import * as t from '@babel/types'
import * as template from '@babel/template'
import * as babel from '@babel/core'
import { splitPrefix } from './constants'
import { eliminateUnreferencedIdentifiers } from './eliminateUnreferencedIdentifiers'

type SplitModulesById = Record<
  string,
  { id: string, node: t.FunctionExpression }
>

interface State {
  filename: string
  opts: {
    minify: boolean
    root: string
  }
  imported: Record<string, boolean>
  refs: Set<any>
  serverIndex: number
  splitIndex: number
  splitModulesById: SplitModulesById
}

export type CompileFn = (compileOpts: {
  code: string
  filename: string
  getBabelConfig: () => { plugins: Array<any> }
}) => Promise<{
  code: string
  map: any
}>

export function makeCompile(makeOpts: { root: string }) {
  return async (opts: {
    code: string
    filename: string
    getBabelConfig: () => { plugins: Array<any> }
  }): Promise<{
    code: string
    map: any
  }> => {
    const res = await babel.transform(opts.code, {
      plugins: [
        ['@babel/plugin-syntax-jsx', {}],
        [
          '@babel/plugin-syntax-typescript',
          {
            isTSX: true,
          },
        ],
        ...opts.getBabelConfig().plugins,
      ],
      root: makeOpts.root,
      filename: opts.filename,
      sourceMaps: true,
    })

    if (res?.code) {
      return {
        code: res.code,
        map: res.map,
      }
    }

    return {
      code: opts.code,
      map: null,
    }
  }
}

export async function compileFile(opts: {
  code: string
  compile: CompileFn
  filename: string
}) {
  return await opts.compile({
    code: opts.code,
    filename: opts.filename,
    getBabelConfig: () => ({
      plugins: [
        [
          {
            visitor: {
              Program: {
                enter(programPath: babel.NodePath<t.Program>, state: State) {
                  const splitUrl = `${splitPrefix}:${opts.filename}?${splitPrefix}`

                  programPath.traverse(
                    {
                      CallExpression: (path) => {
                        if (path.node.callee.type === 'Identifier') {
                          if (path.node.callee.name === 'createServerFn') {
                            // If the function at createServerFn(_, MyFunc) doesn't have a
                            // 'use server' directive at the top of the function scope,
                            // then add it.

                            const fn = path.node.arguments[1]

                            if (
                              t.isFunctionExpression(fn)
                              || t.isArrowFunctionExpression(fn)
                            ) {
                              if (t.isBlockStatement(fn.body)) {
                                const hasUseServerDirective
                                  = fn.body.directives.some((directive) => {
                                    return (
                                      directive.value.value === 'use server'
                                    )
                                  })

                                if (!hasUseServerDirective) {
                                  fn.body.directives.unshift(
                                    t.directive(
                                      t.directiveLiteral('use server'),
                                    ),
                                  )
                                }
                              }
                            }
                          }
                          else if (
                            path.node.callee.name === 'createRoute'
                            || path.node.callee.name === 'createFileRoute'
                          ) {
                            if (
                              path.parentPath.node.type === 'CallExpression'
                            ) {
                              const options = resolveIdentifier(
                                path,
                                path.parentPath.node.arguments[0],
                              )

                              let found = false

                              const hasImportedOrDefinedIdentifier = (
                                name: string,
                              ) => {
                                return programPath.scope.hasBinding(name)
                              }

                              if (t.isObjectExpression(options)) {
                                options.properties.forEach((prop) => {
                                  if (t.isObjectProperty(prop)) {
                                    if (t.isIdentifier(prop.key)) {
                                      if (prop.key.name === 'component') {
                                        const value = prop.value

                                        if (t.isIdentifier(value))
                                          removeIdentifierLiteral(path, value)

                                        // Prepend the import statement to the program along with the importer function
                                        // Check to see if lazyRouteComponent is already imported before attempting
                                        // to import it again

                                        if (
                                          !hasImportedOrDefinedIdentifier(
                                            'lazyRouteComponent',
                                          )
                                        ) {
                                          programPath.unshiftContainer('body', [
                                            template.smart(
                                              `import { lazyRouteComponent } from '@tanstack/react-router'`,
                                            )() as t.Statement,
                                          ])
                                        }

                                        if (
                                          !hasImportedOrDefinedIdentifier(
                                            '$$splitComponentImporter',
                                          )
                                        ) {
                                          programPath.unshiftContainer('body', [
                                            template.smart(
                                              `const $$splitComponentImporter = () => import('${splitUrl}')`,
                                            )() as t.Statement,
                                          ])
                                        }

                                        prop.value = template.expression(
                                          `lazyRouteComponent($$splitComponentImporter, 'component')`,
                                        )() as any

                                        programPath.pushContainer('body', [
                                          template.smart(
                                            `function DummyComponent() { return null }`,
                                          )() as t.Statement,
                                        ])

                                        found = true
                                      }
                                      else if (prop.key.name === 'loader') {
                                        const value = prop.value

                                        if (t.isIdentifier(value))
                                          removeIdentifierLiteral(path, value)

                                        // Prepend the import statement to the program along with the importer function

                                        if (
                                          !hasImportedOrDefinedIdentifier(
                                            'lazyFn',
                                          )
                                        ) {
                                          programPath.unshiftContainer('body', [
                                            template.smart(
                                              `import { lazyFn } from '@tanstack/react-router'`,
                                            )() as t.Statement,
                                          ])
                                        }

                                        if (
                                          !hasImportedOrDefinedIdentifier(
                                            '$$splitLoaderImporter',
                                          )
                                        ) {
                                          programPath.unshiftContainer('body', [
                                            template.smart(
                                              `const $$splitLoaderImporter = () => import('${splitUrl}')`,
                                            )() as t.Statement,
                                          ])
                                        }

                                        prop.value = template.expression(
                                          `lazyFn($$splitLoaderImporter, 'loader')`,
                                        )() as any

                                        found = true
                                      }
                                    }
                                  }

                                  programPath.scope.crawl()
                                })
                              }

                              if (found as boolean) {
                                programPath.pushContainer('body', [
                                  template.smart(
                                    `function TSR_Dummy_Component() {}`,
                                  )() as t.Statement,
                                ])
                              }
                            }
                          }
                        }
                      },
                    },
                    state,
                  )

                  eliminateUnreferencedIdentifiers(programPath)
                },
              },
            },
          },
          {
            root: process.cwd(),
            minify: process.env.NODE_ENV === 'production',
          },
        ],
      ].filter(Boolean),
    }),
  })
}

// Reusable function to get literal value or resolve variable to literal
function resolveIdentifier(path: any, node: any) {
  if (t.isIdentifier(node)) {
    const binding = path.scope.getBinding(node.name)
    if (
      binding
      // && binding.kind === 'const'
    ) {
      const declarator = binding.path.node
      if (t.isObjectExpression(declarator.init))
        return declarator.init
      else if (t.isFunctionDeclaration(declarator.init))
        return declarator.init
    }
    return undefined
  }

  return node
}

function removeIdentifierLiteral(path: any, node: any) {
  if (t.isIdentifier(node)) {
    const binding = path.scope.getBinding(node.name)
    if (binding)
      binding.path.remove()
  }
}

const splitNodeTypes = ['component', 'loader'] as const
type SplitNodeType = (typeof splitNodeTypes)[number]

export async function splitFile(opts: {
  code: string
  compile: CompileFn
  filename: string
  // ref: string
}) {
  return await opts.compile({
    code: opts.code,
    filename: opts.filename,
    getBabelConfig: () => ({
      plugins: [
        [
          {
            visitor: {
              Program: {
                enter(programPath: babel.NodePath<t.Program>, state: State) {
                  const splitNodesByType: Record<
                    SplitNodeType,
                    t.Node | undefined
                  > = {
                    component: undefined,
                    loader: undefined,
                  }

                  // Find the node
                  programPath.traverse(
                    {
                      CallExpression: (path) => {
                        if (path.node.callee.type === 'Identifier') {
                          if (path.node.callee.name === 'createServerFn') {
                            // If the function at createServerFn(_, MyFunc) doesn't have a
                            // 'use server' directive at the top of the function scope,
                            // then add it.

                            const fn = path.node.arguments[1]

                            if (
                              t.isFunctionExpression(fn)
                              || t.isArrowFunctionExpression(fn)
                            ) {
                              if (t.isBlockStatement(fn.body)) {
                                const hasUseServerDirective
                                  = fn.body.directives.some((directive) => {
                                    return (
                                      directive.value.value === 'use server'
                                    )
                                  })

                                if (!hasUseServerDirective) {
                                  fn.body.directives.unshift(
                                    t.directive(
                                      t.directiveLiteral('use server'),
                                    ),
                                  )
                                }
                              }
                            }
                          }
                          else if (
                            path.node.callee.name === 'createRoute'
                            || path.node.callee.name === 'createFileRoute'
                          ) {
                            if (
                              path.parentPath.node.type === 'CallExpression'
                            ) {
                              const options = resolveIdentifier(
                                path,
                                path.parentPath.node.arguments[0],
                              )

                              if (t.isObjectExpression(options)) {
                                options.properties.forEach((prop) => {
                                  if (t.isObjectProperty(prop)) {
                                    splitNodeTypes.forEach((type) => {
                                      if (t.isIdentifier(prop.key)) {
                                        if (prop.key.name === type)
                                          splitNodesByType[type] = prop.value
                                      }
                                    })
                                  }
                                })

                                // Remove all of the options
                                options.properties = []
                              }
                            }
                          }
                        }
                      },
                    },
                    state,
                  )

                  splitNodeTypes.forEach((splitType) => {
                    let splitNode = splitNodesByType[splitType]

                    if (!splitNode)
                      return

                    while (t.isIdentifier(splitNode)) {
                      const binding = programPath.scope.getBinding(
                        splitNode.name,
                      )
                      splitNode = binding?.path.node
                    }

                    // Add the node to the program
                    if (splitNode) {
                      if (t.isFunctionDeclaration(splitNode)) {
                        programPath.pushContainer(
                          'body',
                          t.variableDeclaration('const', [
                            t.variableDeclarator(
                              t.identifier(splitType),
                              t.functionExpression(
                                splitNode.id || null, // Anonymize the function expression
                                splitNode.params,
                                splitNode.body,
                                splitNode.generator,
                                splitNode.async,
                              ),
                            ),
                          ]),
                        )
                      }
                      else if (
                        t.isFunctionExpression(splitNode)
                        || t.isArrowFunctionExpression(splitNode)
                      ) {
                        programPath.pushContainer(
                          'body',
                          t.variableDeclaration('const', [
                            t.variableDeclarator(
                              t.identifier(splitType),
                              splitNode as any,
                            ),
                          ]),
                        )
                      }
                      else if (t.isImportSpecifier(splitNode)) {
                        programPath.pushContainer(
                          'body',
                          t.variableDeclaration('const', [
                            t.variableDeclarator(
                              t.identifier(splitType),
                              splitNode.local,
                            ),
                          ]),
                        )
                      }
                      else {
                        console.info(splitNode)
                        throw new Error(
                          `Unexpected splitNode type ☝️: ${splitNode.type}`,
                        )
                      }
                    }

                    // If the splitNode exists at the top of the program
                    // then we need to remove that copy
                    programPath.node.body = programPath.node.body.filter(
                      (node) => {
                        return node !== splitNode
                      },
                    )

                    // Export the node
                    programPath.pushContainer('body', [
                      t.exportNamedDeclaration(null, [
                        t.exportSpecifier(
                          t.identifier(splitType),
                          t.identifier(splitType),
                        ),
                      ]),
                    ])
                  })

                  // convert exports to imports from the original file
                  programPath.traverse({
                    ExportNamedDeclaration(path) {
                      // e.g. export const x = 1 or export { x }
                      // becomes
                      // import { x } from '${opts.id}'

                      if (path.node.declaration) {
                        if (t.isVariableDeclaration(path.node.declaration)) {
                          path.replaceWith(
                            t.importDeclaration(
                              path.node.declaration.declarations.map(decl =>
                                t.importSpecifier(
                                  t.identifier((decl.id as any).name),
                                  t.identifier((decl.id as any).name),
                                ),
                              ),
                              t.stringLiteral(
                                opts.filename.split(
                                  `?${splitPrefix}`,
                                )[0] as string,
                              ),
                            ),
                          )
                        }
                      }
                    },
                  })

                  eliminateUnreferencedIdentifiers(programPath)
                },
              },
            },
          },
          {
            root: process.cwd(),
            minify: process.env.NODE_ENV === 'production',
          },
        ],
      ].filter(Boolean),
    }),
  })
}
