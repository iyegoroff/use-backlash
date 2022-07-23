import React, { memo, useRef } from 'react'
import { Command, UpdateMap, useBacklash } from 'use-backlash'
import { gap } from './gap'

type State = 'loading' | number
type Action = [tag: 'loaded', count: number] | [tag: 'inc'] | [tag: 'dec']
type Deps = { store: (item: string) => void; load: () => string | undefined }

const key = 'counter'

const init = (): Command<State, Action, Deps> => [
  'loading',
  ({ load }, { loaded }) => loaded(+(load() ?? 0) || 0)
]

const modify =
  (op: (val: number) => number) =>
  (state: State): Command<State, Action, Deps> => {
    if (state === 'loading') {
      return [state]
    }

    const next = op(state)

    return [next, ({ store }) => store(JSON.stringify(next))]
  }

const update: UpdateMap<State, Action, Deps> = {
  loaded: (_, count) => [count],

  inc: modify((val) => val + 1),

  dec: modify((val) => val - 1)
}

const store = (item: string) => localStorage.setItem(key, item)

const load = () => localStorage.getItem(key) ?? undefined

export const PersistentCounter = () => {
  const [state, actions] = useBacklash(init, update, { store, load })

  // eslint-disable-next-line no-null/no-null
  return state === 'loading' ? null : (
    <>
      <button onClick={actions.inc}>inc</button>
      {gap}
      <button onClick={actions.dec}>dec</button>
      {gap}
      <div>{state}</div>
    </>
  )
}
