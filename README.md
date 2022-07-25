# use-backlash

[![npm](https://img.shields.io/npm/v/use-backlash)](https://npm.im/use-backlash)
[![build](https://github.com/iyegoroff/use-backlash/workflows/build/badge.svg)](https://github.com/iyegoroff/use-backlash/actions/workflows/build.yml)
[![publish](https://github.com/iyegoroff/use-backlash/workflows/publish/badge.svg)](https://github.com/iyegoroff/use-backlash/actions/workflows/publish.yml)
[![codecov](https://codecov.io/gh/iyegoroff/use-backlash/branch/main/graph/badge.svg?token=YC314L3ZF7)](https://codecov.io/gh/iyegoroff/use-backlash)
[![Type Coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fiyegoroff%2Fuse-backlash%2Fmain%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/use-backlash)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/use-backlash?label=min+gzip)](https://bundlephobia.com/package/use-backlash)
[![npm](https://img.shields.io/npm/l/use-backlash.svg?t=1495378566926)](https://www.npmjs.com/package/use-backlash)

useReducer with effects, the elmish way

## Getting started

```
npm i use-backlash
```

## Description

This hook is a basic approach to split view/logic/effects in React. It was developed as a boilerplate-free substitute of [ts-elmish](https://github.com/iyegoroff/ts-elmish) project. While it doesn't support effect composition or complex effect creators, it is easier to grasp and have enough power to handle all of the UI-logic for a single component. It also works in [StrictMode](https://reactjs.org/docs/strict-mode.html) and is easy to [test](test/index.spec.tsx#L5-L27)

## Tutorial

This is going to be a Counter.

```ts
import React from 'react'
import { UpdateMap, useBacklash } from 'use-backlash'

// State can be anything,
type State = number

// but an Action is always a union of tuples,
// where the first element is the name of an action
// and should be a string.
type Action = [tag: 'inc'] | [tag: 'dec']

// init function has no arguments and just
// returns initial state wrapped in array.
const init = () => [0] as const

// Unlike with standard useReducer update/reducer
// is not a function with a switch statement inside,
// it is an object where each key is an action name
// and each value is a reducer that takes a state,
// rest action elements (if any) and returns next
// state wrapped in array.
// There is a helper UpdateMap type, that checks
// the shape of update object and makes writing
// types by hand optional.
const update: UpdateMap<State, Action> = {
  inc: (state) => [state + 1],

  dec: (state) => [state - 1]
}

export const Counter = () => {
  // In this example useBacklash hook takes init & update
  // functions and returns a tuple containing state & actions.
  // Note that every argument of useBacklash is 'initial' and
  // changing these things won't affect the behavior of the hook.
  // Also the actions object is guaranteed to remain the same
  // during rerenders just like useReducer's dispatch function.
  const [state, actions] = useBacklash(init, update)

  return (
    <>
      <div>{state}</div>
      <button onClick={actions.inc}>inc</button>
      <button onClick={actions.dec}>dec</button>
    </>
  )
}
```

Passing arguments to init function.

```ts
// Let's change the init function to have a single parameter
const init = (count: number) => [count] as const

// ...

export const Counter = () => {
  // Inside useBacklash body init function is called only once,
  // so it is ok to inline it.
  const [state, actions] = useBacklash(() => init(5), update)

  // ...
}
```

For now `useBacklash` was used just as a fancy `useReducer` that returns an actions object instead of dispatch function. It doesn't make much sense to use it like this instead of `useReducer`. So let's make that counter persistent and see how `useBacklash` helps to handle side effects.

```ts
import React from 'react'
import { Command, UpdateMap, useBacklash } from 'use-backlash'

// We are going to use localStorage to store the state
// of the Counter. Since I/O is a side effect it can not
// be called directly from the init function. To model the
// situation 'state is not set yet' State type will be extended
// with 'loading' string literal.
type State = 'loading' | number

// Additional action 'loaded' will notify that Counter state is loaded.
type Action = [tag: 'loaded', count: number] | [tag: 'inc'] | [tag: 'dec']

const key = 'counter_key'

// init and each update property functions return
// the value of Command type - [State, ...Effect[]]
const init = (): Command<State, Action> => [
  'loading',
  // The next function is a side effect that will be called by useBacklash
  // internally. Here it has single parameter - the same actions object
  // that is returned from useBacklash call.
  ({ loaded }) => loaded(Number(localStorage.getItem(key)) || 0)
  // Additional can be added after the first one
  // and all of them will run in order.
]

const update: UpdateMap<State, Action> = {
  // The second parameter is value that was passed to the 'loaded' action
  // a few lines earlier.
  loaded: (_, count) => [count],

  inc: (state) => {
    // If someone manages to call 'inc' before the state is loaded,
    // just do nothing, that's the normal strategy for this example.
    if (state === 'loading') {
      return [state]
    }

    const next = state + 1

    // Like the init function an update returns a Command
    return [next, () => localStorage.setItem(key, `${next}`)]
  },

  dec: (state) => {
    if (state === 'loading') {
      return [state]
    }

    // This line is the only difference between 'inc' and 'dec'.
    // Probably I will refactor it someday...
    const next = state - 1

    return [next, () => localStorage.setItem(key, `${next}`)]
  }
}

export const Counter = () => {
  const [state, actions] = useBacklash(init, update)

  return state === 'loading' ? null : (
    <>
      <div>{state}</div>
      <button onClick={actions.inc}>inc</button>
      <button onClick={actions.dec}>dec</button>
    </>
  )
}
```
