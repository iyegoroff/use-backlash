import React, { memo, useEffect } from 'react'
import { useBacklash } from 'use-backlash'
import { init, update, CounterState } from './state'

type CounterProps = {
  readonly initial: CounterState
  readonly onStateChange: (state: CounterState) => void
}

export const Counter = memo(function Counter({ initial, onStateChange }: CounterProps) {
  const [state, actions] = useBacklash(() => init(initial), update)

  useEffect(() => {
    onStateChange(state)
  }, [state, onStateChange])

  return (
    <>
      <div>{state}</div>
      <button onClick={actions.inc}>inc</button>
      <button onClick={actions.dec}>dec</button>
    </>
  )
})
