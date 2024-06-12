import * as React from 'react'

export function importedComponent() {
  return <div>I am imported</div>
}

export function importedLoader() {
  return {
    randomNumber: Math.random(),
  }
}
