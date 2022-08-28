import { Command, UpdateMap } from 'use-backlash'

type State = 'loading' | number

type Action = [tag: 'loaded', count: number] | [tag: 'persist', count: number]

type Injects = ReturnType<typeof import('../Persistence').Persistence>

export const init = (): Command<State, Action, Injects> => [
  'loading',
  ({ loaded }, { load }) => loaded(Number(load()) || 0)
]

export const update: UpdateMap<State, Action, Injects> = {
  loaded: (_, count) => [count],

  persist: (state, count) => [state, (_, { store }) => store(JSON.stringify(count))]
}
