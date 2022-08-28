import {
  array,
  boolean,
  literal,
  map,
  number,
  object,
  optional,
  Spectype,
  string,
  template,
  tuple,
  union
} from 'spectypes'
import { Command, UpdateMap } from 'use-backlash'
import { Result } from 'ts-railway'
import { mapOf } from 'fun-constructors'

type LoadedState = Spectype<typeof checkState>

type State = 'loading' | LoadedState

type Action = [tag: 'loaded', state: LoadedState] | [tag: 'persist', state: LoadedState]

type Injects = ReturnType<typeof import('../Persistence').Persistence>

const checkState = object({
  nextId: number,
  filter: union(literal('done'), literal('active'), literal('all')),
  nextTodoText: optional(string),
  editedId: optional(template(number)),
  todos: map(
    array(
      tuple(
        template(number),
        object({
          done: boolean,
          text: string
        })
      )
    ),
    mapOf
  )
})

const defaultState: State = { nextId: 0, filter: 'all', todos: new Map() }

export const init = (): Command<State, Action, Injects> => [
  'loading',
  ({ loaded }, { load }) => {
    const rawState = load()

    return loaded(
      rawState === undefined
        ? defaultState
        : Result.match(
            {
              failure: (error) => {
                console.warn('DeferredTodos/state: Invalid state', error)
                return defaultState
              },
              success: (success) => success
            },
            checkState(JSON.parse(rawState))
          )
    )
  }
]

export const update: UpdateMap<State, Action, Injects> = {
  loaded: (_, state) => [state],

  persist: (initial, state) => [
    initial,
    (_, { store }) =>
      store(
        JSON.stringify(state, (__, val: unknown) =>
          val instanceof Map ? [...(val as Map<unknown, unknown>).entries()] : val
        )
      )
  ]
}
