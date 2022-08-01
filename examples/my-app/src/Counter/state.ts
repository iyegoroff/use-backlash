import { Command, UpdateMap } from 'use-backlash'
import { Injects } from './common'
import { LoadedCounterState } from './LoadedCounter/state'

export type CounterState = 'loading' | LoadedCounterState
type Action = [tag: 'loaded', count: number]

export const init = (): Command<CounterState, Action, Injects> => [
  'loading',
  ({ loaded }, { load }) => loaded(Number(load()) || 0)
]

export const update: UpdateMap<CounterState, Action, Injects> = {
  loaded: (_, count) => [count]
}
