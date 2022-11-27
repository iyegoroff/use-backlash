import React, { memo } from 'react'
import { object, string } from 'spectypes'
import { Command, UpdateMap, useBacklash } from 'use-backlash'
import { gap } from './gap'

type State = {
  status: 'idle' | 'loading' | { error: string }
  quotes: string[]
}

type Action = {
  requestQuote: []
  success: [quote: string]
  failure: [error: unknown]
  clear: []
}

type Injects = { fetchQuote: () => Promise<string> }

const init = (requestQuoteOnInit: boolean): Command<State, Action, Injects> => {
  const state: State = { status: 'idle', quotes: [] }
  return requestQuoteOnInit ? [state, ({ requestQuote }) => requestQuote()] : [state]
}

const update: UpdateMap<State, Action, Injects> = {
  requestQuote: (state) => [
    { ...state, status: 'loading' },
    ({ success, failure }, { fetchQuote }) => {
      fetchQuote().then(success).catch(failure)
    }
  ],

  success: ({ quotes }, quote) => [{ status: 'idle', quotes: [...quotes, quote] }],

  failure: ({ quotes }, error) => [
    { status: { error: error instanceof Error ? error.message : String(error) }, quotes }
  ],

  clear: (state) => [state.quotes.length === 0 ? state : { ...state, quotes: [] }]
}

const checkBody = object({
  quote: string
})

const fetchQuote = () =>
  fetch('https://api.kanye.rest')
    .then((response) => response.json())
    .then(checkBody)
    .then((body) =>
      body.tag === 'success'
        ? body.success.quote
        : (() => {
            throw new Error(JSON.stringify(body.failure))
          })()
    )

export const FetchQuotes = memo(function FetchQuotes() {
  const [state, actions] = useBacklash(() => init(true), update, { fetchQuote })
  const { status, quotes } = state

  const [message, color] = typeof status === 'string' ? [status, 'black'] : [status.error, 'red']

  return (
    <div>
      <button onClick={actions.requestQuote}>request quote</button>
      {gap}
      <button onClick={actions.clear}>clear</button>
      {gap}
      <div style={{ color }}>{message}</div>
      <ul>
        {quotes.map((quote, idx) => (
          <li key={idx}>{quote}</li>
        ))}
      </ul>
    </div>
  )
})
