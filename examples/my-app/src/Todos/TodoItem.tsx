import React, { memo } from 'react'
import { ActionMap } from 'use-backlash'
import { usePipe } from 'use-pipe-ts'
import { MapKey, MapValue } from '../util'
import { handleInput } from './handle-input'
import { TodosAction, TodosState } from './state'
import { todoDone, todoItem, todoText } from './styles'

type TodoItemProps = MapValue<TodosState['todos']> & {
  readonly id: MapKey<TodosState['todos']>
  readonly isEdited: boolean
  readonly actions: ActionMap<TodosAction>
}

export const TodoItem = memo(function TodoItem({
  id,
  text,
  actions,
  done,
  isEdited
}: TodoItemProps) {
  const del = usePipe([actions.remove, id])
  const toggle = usePipe([actions.toggle, id])
  const startEdit = usePipe([actions.startEdit, id])
  const confirmEdit = usePipe([actions.confirmEdit, id])
  const onKeyDown = usePipe([handleInput, confirmEdit, actions.cancelEdit])

  return (
    <div style={todoItem}>
      <input
        style={todoDone}
        type={'checkbox'}
        checked={done}
        onChange={toggle}
        disabled={isEdited}
      />
      {isEdited ? (
        <input
          style={todoText}
          defaultValue={text}
          autoFocus={true}
          onBlur={actions.cancelEdit}
          onKeyDown={onKeyDown}
        />
      ) : (
        <div style={todoText} onClick={startEdit}>
          {text}
        </div>
      )}
      <button onClick={del} disabled={isEdited}>
        del
      </button>
    </div>
  )
})
