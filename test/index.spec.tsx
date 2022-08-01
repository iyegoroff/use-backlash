import React, { useEffect, useState, useLayoutEffect, useCallback, StrictMode } from 'react'
import { render, cleanup, waitFor, fireEvent, renderHook, act } from '@testing-library/react'
import { ActionMap, Command, UpdateMap, useBacklash } from '../src'

describe('example test', () => {
  afterEach(cleanup)

  type State = number
  type Action = [tag: 'inc']
  type Injects = Record<string, never>

  const init = (): Command<State, Action, Injects> => [0]

  const update: UpdateMap<State, Action, Injects> = {
    inc: (state) => [state + 1]
  }

  test('renderHook & act example', () => {
    const { result } = renderHook(() => useBacklash(init, update))

    act(() => {
      result.current[1].inc()
    })

    expect(result.current[0]).toBe(1)
  })
})

describe('useBacklash', () => {
  afterEach(cleanup)

  test('should rerender less times than the amount of action calls', () => {
    let renders = 0
    const states: number[] = []

    type State = number
    type Action = [tag: 'inc']
    type Injects = Record<string, never>

    const init = () => [0] as const
    const update: UpdateMap<State, Action, Injects> = {
      inc: (state) => [
        state + 1,
        () => {
          states.push(state + 1)
        }
      ]
    }

    const Counter = () => {
      const [state, actions] = useBacklash(init, update)

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
    type Injects = Record<string, never>

    const init = (): Command<State, Action, Injects> => [
      [],
      ({ push }) => push(0),
      ({ push }) => push(1),
      ({ push }) => push(5)
    ]
    const update: UpdateMap<State, Action, Injects> = {
      push: (state, value) => [
        [...state, value],
        ({ push }) => {
          if (value === 1) {
            push(2)
            push(3)
            push(4)
          }
          if (value === 20) {
            push(21)
            push(22)
          }
        }
      ]
    }

    const List = () => {
      const [state, actions] = useBacklash(init, update)

      useEffect(() => {
        actions.push(10)
        actions.push(20)
        actions.push(30)
      }, [actions])

      return <div data-testid='result'>{state.join()}</div>
    }

    const { getByTestId } = render(<List />)
    expect(getByTestId('result').textContent).toEqual('0,1,2,3,4,5,10,20,21,22,30')
  })

  test('should preserve effect order when adding single effect', () => {
    type State = readonly number[]
    type Action = [tag: 'push', value: number, effects: number[]]
    type Injects = Record<string, never>

    const init = (): Command<State, Action, Injects> => [[], ({ push }) => push(0, [1, 2])]
    const update: UpdateMap<State, Action, Injects> = {
      push: (state, value, [first, ...rest]) => {
        const nextState = [...state, value]
        return first === undefined ? [nextState] : [nextState, ({ push }) => push(first, rest)]
      }
    }

    const List = () => {
      const [state, actions] = useBacklash(init, update)

      useLayoutEffect(() => {
        actions.push(3, [4, 5])
        actions.push(6, [7, 8])
      }, [actions])

      useEffect(() => {
        actions.push(9, [10, 11])
        actions.push(12, [13, 14])
      }, [actions])

      return <div data-testid='result'>{state.join()}</div>
    }

    const { getByTestId } = render(<List />)
    expect(getByTestId('result').textContent).toEqual('0,1,2,3,4,5,6,7,8,9,10,11,12,13,14')
  })

  test('should preserve effect order when adding multiple effects', () => {
    type State = readonly number[]
    type Action = [tag: 'push', value: number, effects?: number[][]]
    type Injects = Record<string, never>

    const init = (): Command<State, Action, Injects> => [
      [],
      ({ push }) =>
        push(0, [
          [1, 2],
          [3, 4]
        ])
    ]
    const update: UpdateMap<State, Action, Injects> = {
      push: (state, value, effects) => [
        [...state, value],
        ...(effects ?? []).map(([first, ...rest]) => ({ push }: ActionMap<Action>) => {
          if (first !== undefined) {
            push(first, [rest])
          }
        })
      ]
    }

    const List = () => {
      const [state, actions] = useBacklash(init, update)

      useLayoutEffect(() => {
        actions.push(5, [
          [6, 7],
          [8, 9]
        ])
        actions.push(10, [
          [11, 12],
          [13, 14]
        ])
      }, [actions])

      useEffect(() => {
        actions.push(15, [
          [16, 17],
          [18, 19]
        ])
        actions.push(20, [
          [21, 22],
          [23, 24]
        ])
      }, [actions])

      return <div data-testid='result'>{state.join()}</div>
    }

    const { getByTestId } = render(<List />)
    expect(getByTestId('result').textContent).toEqual(
      '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24'
    )
  })

  test('should handle async effects', async () => {
    type State = 'idle' | 'loading' | { text: string }
    type Action = [tag: 'start'] | [tag: 'done', text: string]
    type Injects = { fetch: () => Promise<string> }

    const init = () => ['idle'] as const
    const update: UpdateMap<State, Action, Injects> = {
      start: () => ['loading', ({ done }, { fetch }) => fetch().then(done)],

      done: (_, text) => [{ text }]
    }

    const fetch = () =>
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('some text'), 500)
      })

    const Async = () => {
      const [state, actions] = useBacklash(init, update, { fetch })

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
    type Injects = { delay: () => Promise<unknown> }

    const init = () => [0] as const
    const update: UpdateMap<State, Action, Injects> = {
      inc: (state) => [state + 1, ({ inc }, { delay }) => delay().then(inc)]
    }

    const delay = () =>
      new Promise((resolve) => {
        setTimeout(resolve, 100)
      })

    const Counter = () => {
      const [state, actions] = useBacklash(init, update, { delay })

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
    type Injects = Record<string, never>

    const init = (): Command<State, Action, Injects> => [
      0,
      ({ inc }) => inc(),
      ({ inc }) => inc(),
      ({ inc }) => inc()
    ]

    const update: UpdateMap<State, Action, Injects> = {
      inc: (state) => [state + 1]
    }

    const Counter = () => {
      const [state] = useBacklash(init, update)

      return <div data-testid='result'>{state}</div>
    }

    const { getByTestId } = render(<Counter />)
    expect(getByTestId('result').textContent).toEqual('3')
  })

  test('should listen inject changes', async () => {
    type State = number
    type Action = [tag: 'done', amount: number] | [tag: 'start']
    type Injects = { amount: number }

    const init = (): Command<State, Action, Injects> => [0, ({ done }, { amount }) => done(amount)]

    const update: UpdateMap<State, Action, Injects> = {
      start: (state) => [state, ({ done }, { amount }) => done(amount)],

      done: (_, amount) => [amount]
    }

    const Setter = () => {
      const [amount, setAmount] = useState(3)
      const [state, { start }] = useBacklash(init, update, { amount })

      const incAmount = useCallback(() => setAmount((a) => a + 3), [])

      return (
        <>
          <button data-testid='start' onClick={start} />
          <button data-testid='inc-amount' onClick={incAmount} />
          <div data-testid='result'>{state}</div>
        </>
      )
    }

    const { getByTestId } = render(<Setter />)

    const start = getByTestId('start')
    const incAmount = getByTestId('inc-amount')

    fireEvent.click(start)
    fireEvent.click(incAmount)

    await new Promise((resolve) => {
      setTimeout(() => {
        fireEvent.click(start)
        resolve(undefined)
      }, 300)
    })

    await waitFor(() => {
      expect(getByTestId('result').textContent).toEqual('6')
    })
  })

  test('should queue effects during commit phase', () => {
    let effectCount = 0

    type State = number
    type Action = [tag: 'inc']
    type Injects = Record<string, never>

    const init = () => [0] as const
    const update: UpdateMap<State, Action, Injects> = {
      inc: (state) => [
        state + 1,
        () => {
          effectCount++
        }
      ]
    }

    const Counter = () => {
      const [hasClicked, setHasClicked] = useState(false)
      const [state, actions] = useBacklash(init, update)

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

  test('should take account of StrictMode', async () => {
    type State = number
    type Action = [tag: 'inc']
    type Injects = Record<string, never>

    const init = (count: number): Command<State, Action, Injects> => [
      count,
      ({ inc }) => inc(),
      ({ inc }) => inc()
    ]

    const update: UpdateMap<State, Action, Injects> = {
      inc: (state) => [state + 1]
    }

    const Counter = () => {
      const [state, actions] = useBacklash(() => init(1), update)

      return (
        <>
          <button data-testid='button' onClick={actions.inc} />
          <div data-testid='result'>{state}</div>
        </>
      )
    }

    const App = () => (
      <StrictMode>
        <Counter />
      </StrictMode>
    )

    const { getByTestId } = render(<App />)
    const button = getByTestId('button')

    fireEvent.click(button)

    await new Promise((resolve) => {
      setTimeout(() => resolve(fireEvent.click(button)), 100)
    })

    fireEvent.click(button)

    await waitFor(() => {
      expect(getByTestId('result').textContent).toEqual('6')
    })
  })

  test('should run intial effects prior to effects triggered from useLayoutEffect', () => {
    type State = string[]
    type Action = [tag: 'add', value: string]
    type Injects = Record<string, never>

    const init = (value: string): Command<State, Action, Injects> => [
      [value],
      ({ add }) => add('init 1'),
      ({ add }) => add('init 2'),
      ({ add }) => add('init 3')
    ]

    const update: UpdateMap<State, Action, Injects> = {
      add: (state, value) => [[...state, value]]
    }

    const Counter = () => {
      const [state, actions] = useBacklash(() => init('first'), update)

      useEffect(() => {
        actions.add('useEffect 1')
        actions.add('useEffect 2')
        actions.add('useEffect 3')
      }, [actions])

      useLayoutEffect(() => {
        actions.add('useLayoutEffect 1')
        actions.add('useLayoutEffect 2')
        actions.add('useLayoutEffect 3')
      }, [actions])

      return <div data-testid='result'>{state.join()}</div>
    }

    const App = () => <Counter />

    const { getByTestId } = render(<App />)
    expect(getByTestId('result').textContent).toEqual(
      'first,init 1,init 2,init 3,useLayoutEffect 1,useLayoutEffect 2,useLayoutEffect 3,' +
        'useEffect 1,useEffect 2,useEffect 3'
    )
  })

  test('should not rerender when setting same state', async () => {
    let renders = 0

    type State = number[]
    type Action = [tag: 'clear']
    type Injects = Record<string, never>

    const init = () => [[1, 2, 3]] as const
    const update: UpdateMap<State, Action, Injects> = {
      clear: (state) => [state.length === 0 ? state : []]
    }

    const Counter = () => {
      const [state, actions] = useBacklash(init, update)

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
      setTimeout(() => resolve(fireEvent.click(button)), 100)
    })

    await new Promise((resolve) => {
      setTimeout(() => resolve(fireEvent.click(button)), 300)
    })

    await waitFor(() => {
      expect(renders).toBeLessThan(3)
    })
  })

  test('should call init only once', async () => {
    let renders = 0
    let initCreatorCalls = 0
    let initCalls = 0

    type State = number
    type Action = [tag: 'inc']
    type Injects = Record<string, never>

    const init = () => {
      initCalls++
      return [0] as const
    }
    const update: UpdateMap<State, Action, Injects> = {
      inc: (state) => [state + 1]
    }

    const createInit = () => {
      initCreatorCalls++

      return () => init()
    }

    const Counter = () => {
      const [state, actions] = useBacklash(createInit(), update)

      useEffect(() => {
        actions.inc()
      }, [actions])

      useEffect(() => {
        setTimeout(actions.inc, 100)
      }, [actions])

      useEffect(() => {
        setTimeout(actions.inc, 200)
      }, [actions])

      renders++

      return <div data-testid='result'>{state}</div>
    }

    const { getByTestId } = render(<Counter />)

    await waitFor(() => {
      expect(getByTestId('result').textContent).toEqual(`${renders - 1}`)
      expect(initCreatorCalls).toEqual(renders)
      expect(initCalls).toEqual(1)
    })
  })

  test('should ignore update object changes', async () => {
    let newUpdateWasCalled = false
    let setNewUpdateWasCalled = false

    type State = number
    type Action = [tag: 'inc']
    type Injects = Record<string, never>

    const init = () => [0] as const

    const oldUpdate: UpdateMap<State, Action, Injects> = {
      inc: (state) => [state + 1]
    }

    const newUpdate: UpdateMap<State, Action, Injects> = {
      inc: (state) => {
        newUpdateWasCalled = true
        return [state + 100]
      }
    }

    const Counter = () => {
      const [update, setUpdate] = useState(oldUpdate)
      const [state, actions] = useBacklash(init, update)

      useEffect(() => {
        actions.inc()
      }, [actions])

      useEffect(() => {
        setTimeout(() => {
          setNewUpdateWasCalled = true
          setUpdate(newUpdate)
        }, 100)
      }, [])

      useEffect(() => {
        setTimeout(actions.inc, 200)
      }, [actions])

      return <div data-testid='result'>{state}</div>
    }

    const { getByTestId } = render(<Counter />)

    await waitFor(() => {
      expect(getByTestId('result').textContent).toEqual(`2`)
      expect(setNewUpdateWasCalled).toBeTruthy()
      expect(newUpdateWasCalled).toBeFalsy()
    })
  })
})
