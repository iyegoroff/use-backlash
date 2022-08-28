import React, { memo, useEffect } from 'react'
import { useBacklash } from 'use-backlash'
import { init, TodosState, update } from './state'
import { TodoFilter } from './TodoFilter'
import { TodoList } from './TodoList'

type TodosProps = {
  readonly initial: TodosState
  readonly onStateChange: (state: TodosState) => void
}

export const Todos = memo(function Todos({ initial, onStateChange }: TodosProps) {
  const [state, actions] = useBacklash(() => init(initial), update)
  const { todos, editedId, filter } = state

  useEffect(() => {
    onStateChange(state)
  }, [state, onStateChange])

  return (
    <>
      <TodoFilter filter={filter} actions={actions} />
      <TodoList todos={todos} editedId={editedId} filter={filter} actions={actions} />
    </>
  )
})
