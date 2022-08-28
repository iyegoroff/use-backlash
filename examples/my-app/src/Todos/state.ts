import { UpdateMap } from 'use-backlash'

type Todo = { done: boolean; text: string }

type Filter = 'done' | 'active' | 'all'

type Id = `${number}`

export type TodosState = {
  nextId: number
  editedId?: Id
  filter: Filter
  todos: ReadonlyMap<Id, Todo>
}

export type TodosAction =
  | [tag: 'add', text: string]
  | [tag: 'remove', id: Id]
  | [tag: 'startEdit', id: Id]
  | [tag: 'confirmEdit', id: Id, text: string]
  | [tag: 'cancelEdit']
  | [tag: 'toggle', id: Id]
  | [tag: 'filter', value: Filter]
  | [tag: 'updateNextTodoText', text: string]

export const init = (state: Readonly<TodosState>) => [state] as const

export const update: UpdateMap<TodosState, TodosAction> = {
  updateNextTodoText: (state, text) => [{ ...state, nextTodoText: text }],

  add: (state, text) => {
    const { nextId, todos } = state

    return [
      text === ''
        ? state
        : {
            ...state,
            nextId: nextId + 1,
            todos: new Map(todos).set(`${nextId}`, { text, done: false })
          }
    ]
  },

  startEdit: (state, id) => [{ ...state, editedId: id }],

  cancelEdit: (state) => [{ ...state, editedId: undefined }],

  confirmEdit: (state, id, text) => {
    const { todos } = state
    const todo = todos.get(id)

    return todo === undefined
      ? [{ ...state, editedId: undefined }]
      : [{ ...state, todos: new Map(todos).set(id, { ...todo, text }), editedId: undefined }]
  },

  remove: ({ todos, ...rest }, id) => {
    const nextTodos = new Map(todos)

    nextTodos.delete(id)

    return [{ ...rest, todos: nextTodos }]
  },

  filter: (state, value) => [{ ...state, filter: value }],

  toggle: (state, id) => {
    const { todos } = state
    const todo = todos.get(id)

    return todo === undefined
      ? [state]
      : [{ ...state, todos: new Map(todos).set(id, { ...todo, done: !todo.done }) }]
  }
}
