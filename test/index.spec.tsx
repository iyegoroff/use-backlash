import React, { useEffect } from 'react'
import { render, cleanup, waitFor } from '@testing-library/react'
import { Update, useBacklash } from '../src'

describe('useBacklash', () => {
  afterEach(cleanup)

  test('basic', () => {
    let renders = 0
    const states: number[] = []

    type State = number
    type Action = [tag: 'inc']
    type Deps = Record<string, never>

    const init = () => [0] as const
    const update: Update<State, Action, Deps> = {
      inc: (state) => [
        state + 1,
        () => {
          states.push(state + 1)
        }
      ]
    }

    const Counter = () => {
      const [state, actions] = useBacklash(undefined, init, update, {})

      useEffect(() => {
        actions.inc()
        actions.inc()
        actions.inc()
        actions.inc()
        actions.inc()
      }, [actions])

      renders++

      return <div data-testid='result'>{state}</div>
    }

    const { getByTestId } = render(<Counter />)
    expect(getByTestId('result').textContent).toEqual('5')
    expect(states).toEqual([1, 2, 3, 4, 5])
    expect(renders).toBeLessThan(states.length)
  })

  test('effect order', () => {
    type State = readonly number[]
    type Action = [tag: 'push', value: number]
    type Deps = Record<string, never>

    const init = () => [[]] as const
    const update: Update<State, Action, Deps> = {
      push: (state, value) => [
        [...state, value],
        (_, { push }) => {
          if (value === 20) {
            push(21)
            push(22)
          }
        }
      ]
    }

    const List = () => {
      const [state, actions] = useBacklash(undefined, init, update, {})

      useEffect(() => {
        actions.push(10)
        actions.push(20)
        actions.push(30)
      }, [actions])

      return <div data-testid='result'>{state.join()}</div>
    }

    const { getByTestId } = render(<List />)
    expect(getByTestId('result').textContent).toEqual('10,20,21,22,30')
  })

  test('async', async () => {
    type State = 'idle' | 'loading' | { text: string }
    type Action = [tag: 'start'] | [tag: 'done', text: string]
    type Deps = { fetch: () => Promise<string> }

    const init = () => ['idle'] as const
    const update: Update<State, Action, Deps> = {
      start: () => ['loading', ({ fetch }, { done }) => fetch().then(done)],

      done: (_, text) => [{ text }]
    }

    const fetch = () =>
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('some text'), 500)
      })

    const Async = () => {
      const [state, actions] = useBacklash(undefined, init, update, { fetch })

      useEffect(() => {
        actions.start()
      }, [actions])

      return <div data-testid='result'>{JSON.stringify(state)}</div>
    }

    const { getByTestId } = render(<Async />)

    await waitFor(() => {
      expect(getByTestId('result').textContent).toEqual('{"text":"some text"}')
    })
  })
})
