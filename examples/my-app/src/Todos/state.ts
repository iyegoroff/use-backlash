import { boolean, literal, number, object, record, string, template, union } from 'spectypes'
import { Command, UpdateMap } from 'use-backlash'
import { TodosState } from './ReadyTodos/state'

type Injects = typeof import('./injects').injects

type State = 'loading' | TodosState

type Action = [tag: 'loaded', state: State]

const checkState = object({
  nextId: number,
  filter: union(literal('done'), literal('active'), literal('all')),
  todos: record(
    template(number),
    object({
      done: boolean,
      text: string
    })
  )
})

const defaultState: State = { nextId: 0, filter: 'all', todos: {} }

export const init = (): Command<State, Action, Injects> => [
  'loading',
  ({ loaded }, { load }) => {
    const state = checkState(JSON.parse(load() ?? JSON.stringify(defaultState)))

    return loaded(state.tag === 'success' ? state.success : defaultState)
  }
]

export const update: UpdateMap<State, Action, Injects> = {
  loaded: (_, state) => [state]
}
