import React, { memo } from 'react'
import { useBacklash } from '../use-backlash'
import { Counter } from '../Counter'
import { Persistence } from '../Persistence'
import { init, update } from './state'

const injects = Persistence('counter')

export const PersistentCounter = memo(function PersistentCounter() {
  const [state, actions] = useBacklash(init, update, injects)

  // eslint-disable-next-line no-null/no-null
  return state === 'loading' ? null : <Counter initial={state} onStateChange={actions.persist} />
})
