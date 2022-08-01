import React from 'react'
import { useBacklash } from 'use-backlash'
import { injects } from '../common'
import { init, update, LoadedCounterState } from './state'

export const LoadedCounter = ({ initial }: { readonly initial: LoadedCounterState }) => {
  const [state, actions] = useBacklash(() => init(initial), update, injects)

  return (
    <>
      <div>{state}</div>
      <button onClick={actions.inc}>inc</button>
      <button onClick={actions.dec}>dec</button>
    </>
  )
}
