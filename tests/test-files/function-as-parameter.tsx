import * as React from 'react'
// @ts-expect-error -- this is not a real package
import { useMemo } from 'tan-react'

const _useUsedVar = 'i-am-unused'

const ReactUseMemoCall1 = React.useMemo(() => {
  return 'true'
}, [])

console.log(ReactUseMemoCall1)

const ReactUseMemoCall2 = React.useMemo(() => {
  return 'true'
}, [])

console.log(ReactUseMemoCall2)

const UseMemoCall1 = useMemo(() => {
  return 'true'
}, [])

console.log(UseMemoCall1)

const UseMemoCall2 = useMemo(() => {
  return 'true'
}, [])

console.log(UseMemoCall2)
