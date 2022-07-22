import React, { useEffect, useState, useLayoutEffect, useCallback, StrictMode } from 'react'
import { render, cleanup, waitFor, fireEvent, renderHook, act } from '@testing-library/react'
import { Command, Update, useBacklash } from '../src'

describe('useBacklash', () => {
  afterEach(cleanup)

  test('should rerender less times than the amount of action calls', () => {
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

  test('should preserve effect order', () => {
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

  test('should handle async effects', async () => {
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

  test('should cleanup on unmount', async () => {
    type State = number
    type Action = [tag: 'inc']
    type Deps = { delay: () => Promise<unknown> }

    const init = () => [0] as const
    const update: Update<State, Action, Deps> = {
      inc: (state) => [state + 1, ({ delay }, { inc }) => delay().then(inc)]
    }

    const delay = () =>
      new Promise((resolve) => {
        setTimeout(resolve, 100)
      })

    const Counter = () => {
      const [state, actions] = useBacklash(undefined, init, update, { delay })

      useEffect(() => {
        actions.inc()
      }, [actions])

      return <div data-testid='result'>{state}</div>
    }

    const App = () => {
      const [stepOne, setStepOne] = useState(false)
      const [stepTwo, setStepTwo] = useState(false)

      useEffect(() => {
        setTimeout(() => setStepOne(true), 350)
        setTimeout(() => setStepTwo(true), 650)
      }, [])

      return stepTwo ? (
        <div data-testid='two'>two</div>
      ) : stepOne ? (
        <div data-testid='one'>one</div>
      ) : (
        <Counter />
      )
    }

    const { getByTestId } = render(<App />)

    const result = getByTestId('result')

    await waitFor(() => {
      expect(result.textContent).toEqual('4')
      expect(getByTestId('two').textContent).toEqual('two')
    })
  })

  test('should trigger initial effects', () => {
    type State = number
    type Action = [tag: 'inc']
    type Deps = Record<string, never>

    const init = (): Command<State, Action, Deps> => [
      0,
      (_, { inc }) => inc(),
      (_, { inc }) => inc(),
      (_, { inc }) => inc()
    ]

    const update: Update<State, Action, Deps> = {
      inc: (state) => [state + 1]
    }

    const Counter = () => {
      const [state] = useBacklash(undefined, init, update, {})

      return <div data-testid='result'>{state}</div>
    }

    const { getByTestId } = render(<Counter />)
    expect(getByTestId('result').textContent).toEqual('3')
  })

  test('should pass initial argument', () => {
    type State = number
    type Action = [tag: 'inc']
    type Deps = Record<string, never>

    const init = (count: number): Command<State, Action, Deps> => [count]

    const update: Update<State, Action, Deps> = {
      inc: (state) => [state + 1]
    }

    const Counter = () => {
      const [state] = useBacklash(10, init, update, {})

      return <div data-testid='result'>{state}</div>
    }

    const { getByTestId } = render(<Counter />)
    expect(getByTestId('result').textContent).toEqual('10')
  })

  test('should queue effects during commit phase', () => {
    let effectCount = 0

    type State = number
    type Action = [tag: 'inc']
    type Deps = Record<string, never>

    const init = () => [0] as const
    const update: Update<State, Action, Deps> = {
      inc: (state) => [
        state + 1,
        () => {
          effectCount++
        }
      ]
    }

    const Counter = () => {
      const [hasClicked, setHasClicked] = useState(false)
      const [state, actions] = useBacklash(undefined, init, update, {})

      useLayoutEffect(() => {
        if (hasClicked) {
          actions.inc()
        }
      }, [hasClicked, actions])

      const handleClick = useCallback(() => {
        setHasClicked(true)
        actions.inc()
      }, [actions])

      return (
        <>
          <div data-testid='result'>{state}</div>
          <button data-testid='button' onClick={handleClick} />
        </>
      )
    }

    const { getByTestId } = render(<Counter />)

    expect(getByTestId('result').textContent).toEqual('0')

    const button = getByTestId('button')

    fireEvent.click(button)

    expect(getByTestId('result').textContent).toEqual('2')
    expect(effectCount).toEqual(2)
  })

  test('should take account of StrictMode', () => {
    type State = number
    type Action = [tag: 'inc']
    type Deps = Record<string, never>

    const init = (count: number): Command<State, Action, Deps> => [count, (_, { inc }) => inc()]

    const update: Update<State, Action, Deps> = {
      inc: (state) => [state + 1]
    }

    const Counter = () => {
      const [state, actions] = useBacklash(1, init, update, {})

      useEffect(() => {
        actions.inc()
      }, [actions])

      useLayoutEffect(() => {
        actions.inc()
      }, [actions])

      return <div data-testid='result'>{state}</div>
    }

    const App = () => (
      <StrictMode>
        <Counter />
      </StrictMode>
    )

    const { getByTestId } = render(<App />)
    expect(getByTestId('result').textContent).toEqual('4')
  })

  test('should not rerender when setting same state', async () => {
    let renders = 0

    type State = number[]
    type Action = [tag: 'clear']
    type Deps = Record<string, never>

    const init = () => [[1, 2, 3]] as const
    const update: Update<State, Action, Deps> = {
      clear: (state) => [state.length === 0 ? state : []]
    }

    const Counter = () => {
      const [state, actions] = useBacklash(undefined, init, update, {})

      renders++

      return (
        <div>
          <button data-testid='button' onClick={actions.clear} />
          <div data-testid='result'>{state}</div>
        </div>
      )
    }

    const { getByTestId } = render(<Counter />)

    const button = getByTestId('button')

    await new Promise((resolve) => {
      setTimeout(() => {
        fireEvent.click(button)
        resolve(undefined)
      }, 100)
    })

    await new Promise((resolve) => {
      setTimeout(() => {
        fireEvent.click(button)
        resolve(undefined)
      }, 300)
    })

    await waitFor(() => {
      expect(renders).toBeLessThan(3)
    })
  })

  test('should not be affected by initial value change', () => {
    type State = number
    type Action = [tag: 'inc']
    type Deps = Record<string, never>

    const init = (count: number): Command<State, Action, Deps> => [count, (_, { inc }) => inc()]

    const update: Update<State, Action, Deps> = {
      inc: (state) => [state + 1]
    }

    let initial = 5

    const { result, rerender } = renderHook(() => useBacklash(initial, init, update, {}))

    expect(result.current[0]).toEqual(6)

    act(() => {
      result.current[1].inc()
    })

    expect(result.current[0]).toEqual(7)

    initial = 10
    rerender()

    expect(result.current[0]).toEqual(7)
  })
})
