import React from 'react'
import { Command, UpdateMap, useBacklash } from 'use-backlash'

type State = 'loading' | number
type Action = [tag: 'loaded', count: number] | [tag: 'inc'] | [tag: 'dec']

const key = 'counter_key'

const init = (): Command<State, Action> => [
  'loading',
  ({ loaded }) => loaded(Number(localStorage.getItem(key)) || 0)
]

const update: UpdateMap<State, Action> = {
  loaded: (_, count) => [count],

  inc: (state) => {
    if (state === 'loading') {
      return [state]
    }

    const next = state + 1

    return [next, () => localStorage.setItem(key, `${next}`)]
  },

  dec: (state) => {
    if (state === 'loading') {
      return [state]
    }

    const next = state - 1

    return [next, () => localStorage.setItem(key, `${next}`)]
  }
}

export const Counter = () => {
  const [state, actions] = useBacklash(init, update)

  // eslint-disable-next-line no-null/no-null
  return state === 'loading' ? null : (
    <>
      <div>{state}</div>
      <button onClick={actions.inc}>inc</button>
      <button onClick={actions.dec}>dec</button>
    </>
  )
}
