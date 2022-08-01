import React, { memo } from 'react'
import { useBacklash } from 'use-backlash'
import { injects } from './injects'
import { ReadyTodos } from './ReadyTodos'
import { init, update } from './state'

export const Todos = memo(() => {
  const [state] = useBacklash(init, update, injects)

  // eslint-disable-next-line no-null/no-null
  return state === 'loading' ? null : <ReadyTodos initial={state} />
})
