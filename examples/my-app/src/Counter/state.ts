import { Command, UpdateMap } from 'use-backlash'

export type CounterState = number
type Action = {
  inc: []
  dec: []
}

export const init = (state: number): Command<CounterState, Action> => [state]

export const update: UpdateMap<CounterState, Action> = {
  inc: (state) => [state + 1],

  dec: (state) => [state - 1]
}
