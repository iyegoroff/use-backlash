import React, { createContext, memo, useCallback, useContext } from 'react'
import { ActionMap, Command, UpdateMap, useBacklash } from 'use-backlash'
import { gap } from './gap'

type State = string
type Action = [tag: 'update', value: string]
type Injects = Record<string, never>

const init = (): Command<State, Action, Injects> => ['']

const update: UpdateMap<State, Action, Injects> = {
  update: (_, value) => [value]
}

const StateContext = createContext<State>('')
const ActionsContext = createContext<ActionMap<Action>>({
  update: () => {
    throw new Error('not implemented')
  }
})

const Provider = ({ children }: React.PropsWithChildren) => {
  const [state, actions] = useBacklash(init, update, {})

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  )
}

const Input = memo(() => {
  const state = useContext(StateContext)
  const actions = useContext(ActionsContext)

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => actions.update(e.target.value),
    [actions]
  )

  return <input value={state} onChange={onChange} />
})

const Output = memo(() => {
  const state = useContext(StateContext)

  return <div>{state}</div>
})

export const Context = () => (
  <Provider>
    <Input />
    {gap}
    <Output />
    {gap}
    <Input />
    {gap}
    <Output />
  </Provider>
)
