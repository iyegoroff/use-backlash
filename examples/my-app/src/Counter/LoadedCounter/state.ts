import { Command, UpdateMap } from 'use-backlash'
import { Injects } from '../common'

export type LoadedCounterState = number
type Action = [tag: 'inc'] | [tag: 'dec']

export const init = (state: number): Command<LoadedCounterState, Action, Injects> => [state]

export const update: UpdateMap<LoadedCounterState, Action, Injects> = {
  inc: (state) => {
    const next = state + 1

    return [next, (_, { store }) => store(`${next}`)]
  },

  dec: (state) => {
    const next = state - 1

    return [next, (_, { store }) => store(`${next}`)]
  }
}
