import React, { memo } from 'react'
import { useBacklash } from '../use-backlash'
import { init, update } from './state'
import { Todos } from '../Todos'
import { Persistence } from '../Persistence'

const injects = Persistence('todos')

export const PersistentTodos = memo(function PersistentTodos() {
  const [state, actions] = useBacklash(init, update, injects)

  // eslint-disable-next-line no-null/no-null
  return state === 'loading' ? null : <Todos initial={state} onStateChange={actions.persist} />
})
