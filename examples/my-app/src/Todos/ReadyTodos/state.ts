import { Dict } from 'ts-micro-dict'
import { Command, UpdateMap } from 'use-backlash'

type Injects = typeof import('../injects').injects

export type Todo = { done: boolean; text: string }

type Filter = 'done' | 'active' | 'all'

export type TodosState = {
  nextId: number
  editedId?: string
  filter: Filter
  todos: Dict<string, Todo>
}

export type TodosAction =
  | [tag: 'add', todo: Todo]
  | [tag: 'remove', id: string]
  | [tag: 'startEdit', id: string]
  | [tag: 'confirmEdit', id: string, text: string]
  | [tag: 'cancelEdit']
  | [tag: 'toggle', id: string]
  | [tag: 'filter', value: Filter]

export const init = (state: TodosState) => [state] as const

export const update: UpdateMap<TodosState, TodosAction, Injects> = {
  add: (state, todo) => {
    const { nextId, todos } = state

    return persist({ ...state, nextId: nextId + 1, todos: Dict.put(`${nextId}`, todo, todos) })
  },

  startEdit: (state, id) => [{ ...state, editedId: id }],

  cancelEdit: (state) => [{ ...state, editedId: undefined }],

  confirmEdit: (state, id, text) => {
    const { todos } = state
    const todo = todos[id]

    return todo === undefined
      ? [{ ...state, editedId: undefined }]
      : persist({ ...state, todos: Dict.put(id, { ...todo, text }, todos), editedId: undefined })
  },

  remove: (state, id) => {
    const { todos } = state

    return persist({ ...state, todos: Dict.omit(id, todos) })
  },

  filter: (state, value) => persist({ ...state, filter: value }),

  toggle: (state, id) => {
    const { todos } = state
    const todo = todos[id]

    return todo === undefined
      ? [state]
      : persist({ ...state, todos: Dict.put(id, { ...todo, done: !todo.done }, todos) })
  }
}

const persist = (state: TodosState): Command<TodosState, TodosAction, Injects> => [
  state,
  (_, { store }) => {
    const { editedId, ...rest } = state
    store(JSON.stringify(rest))
  }
]
