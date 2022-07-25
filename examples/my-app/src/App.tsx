import React, { StrictMode } from 'react'
import { Context } from './Context'
import { Counter } from './Counter'
import { FetchQuotes } from './FetchQuotes'
import { PersistentCounter } from './PersistentCounter'

const style = {
  borderColor: 'green',
  borderWidth: '5px',
  borderStyle: 'solid',
  padding: '15px',
  margin: '5px'
} as const

export const App = () => (
  <StrictMode>
    <div style={style}>
      <h3>Counter</h3>
      <Counter />
    </div>
    <div style={style}>
      <h3>Persistent Counter</h3>
      <PersistentCounter />
    </div>
    <div style={style}>
      <h3>Context</h3>
      <Context />
    </div>
    <div style={style}>
      <h3>Fetch Quotes</h3>
      <FetchQuotes />
    </div>
  </StrictMode>
)
