import React, { memo } from 'react'
import { ActionMap } from 'use-backlash'
import { usePipe } from 'use-pipe-ts'
import { changeEventValue, noop } from '../util'
import { handleInput } from './handle-input'
import { TodosAction, TodosState } from './state'
import { todoList } from './styles'
import { TodoItem } from './TodoItem'

type TodoListProps = Pick<TodosState, 'editedId' | 'filter' | 'todos'> & {
  readonly actions: ActionMap<TodosAction>
}

export const TodoList = memo(function TodoList({
  todos,
  filter,
  editedId,
  actions
}: TodoListProps) {
  const updateNextTodoText = usePipe(changeEventValue, actions.updateNextTodoText)
  const onKeyDown = usePipe([handleInput, actions.add, noop])

  return (
    <>
      <div style={todoList}>
        {[...todos]
          .filter(([, { done }]) => filter === 'all' || (filter === 'done') === done)
          .map(([id, todo]) => (
            <TodoItem {...todo} key={id} id={id} isEdited={editedId === id} actions={actions} />
          ))}
      </div>
      <input placeholder={'add todo'} onChange={updateNextTodoText} onKeyDown={onKeyDown} />
    </>
  )
})
