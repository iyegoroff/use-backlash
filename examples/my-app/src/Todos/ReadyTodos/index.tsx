import React, { Fragment, memo } from 'react'
import { Dict } from 'ts-micro-dict'
import { useBacklash, ActionMap } from 'use-backlash'
import { injects } from '../injects'
import { init, Todo, TodosAction, TodosState, update } from './state'

type TodoProps = Todo & {
  readonly id: string
  readonly isEdited: boolean
  readonly actions: ActionMap<TodosAction>
}

const Todo = memo((_props: TodoProps) => {
  return <div>todo</div>
})

export const ReadyTodos = memo(({ initial }: { readonly initial: TodosState }) => {
  const [state, actions] = useBacklash(() => init(initial), update, injects)
  const { todos, editedId } = state

  return (
    <>
      {Dict.toArray(
        (todo, id) => (
          <Fragment key={id}>
            <Todo {...todo} id={id} isEdited={editedId === id} actions={actions} />
          </Fragment>
        ),
        todos
      )}
    </>
  )
})
