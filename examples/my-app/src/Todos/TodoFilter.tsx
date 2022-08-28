import React, { memo } from 'react'
import { ActionMap } from 'use-backlash'
import { usePipe } from 'use-pipe-ts'
import { TodosAction, TodosState } from './state'
import { todoFilter } from './styles'

type TodoFilterProps = Pick<TodosState, 'filter'> & {
  readonly actions: ActionMap<TodosAction>
}

export const TodoFilter = memo(function TodoFilter({ filter, actions }: TodoFilterProps) {
  const setAll = usePipe([actions.filter, 'allc'])
  const setActive = usePipe([actions.filter, 'active'])
  const setDone = usePipe([actions.filter, 'done'])

  return (
    <div style={todoFilter}>
      <button onClick={setAll} disabled={filter === 'all'}>
        all
      </button>
      <button onClick={setActive} disabled={filter === 'active'}>
        active
      </button>
      <button onClick={setDone} disabled={filter === 'done'}>
        done
      </button>
    </div>
  )
})
