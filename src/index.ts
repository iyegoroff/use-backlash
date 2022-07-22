import { useState, useEffect, useRef } from 'react'

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

type PrettyType<V> = Extract<{ [K in keyof V]: V[K] }, unknown>

type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }

type PrettyDeepReadonly<T> = PrettyType<{ readonly [P in keyof T]: PrettyDeepReadonly<T[P]> }>

export function useBacklash<
  Init extends (arg: never) => readonly [State, ...((deps: Deps, actions: ActionMap) => void)[]],
  UpdateMap extends Readonly<
    Record<
      string,
      (
        state: never,
        ...args: never[]
      ) => readonly [State, ...((deps: Deps, actions: ActionMap) => void)[]]
    >
  >,
  Deps extends Readonly<Record<string, unknown>>,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0],
  ActionMap extends {
    readonly [Key in keyof UpdateMap]: Parameters<UpdateMap[Key]> extends [unknown, ...infer Rest]
      ? (...args: Rest) => void
      : never
  }
>(
  initial: Parameters<Init>[0],
  init: Init,
  update: UpdateMap,
  dependencies: Deps
): readonly [PrettyDeepReadonly<State>, ActionMap]

export function useBacklash<
  Init extends (
    arg: never
  ) => readonly [
    State,
    ...((
      deps: Deps,
      actions: Readonly<Record<string, (...args: readonly never[]) => void>>
    ) => void)[]
  ],
  UpdateMap extends Readonly<
    Record<
      string,
      (
        state: never,
        ...args: never[]
      ) => readonly [
        State,
        ...((
          deps: Deps,
          actions: Readonly<Record<string, (...actionArgs: readonly never[]) => void>>
        ) => void)[]
      ]
    >
  >,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0],
  Deps extends Readonly<Record<string, unknown>>
>(
  initial: Parameters<Init>[0],
  init: Init,
  update: UpdateMap,
  dependencies: Deps
): readonly [
  PrettyDeepReadonly<State>,
  Readonly<Record<string, (...args: readonly never[]) => void>>
] {
  const [[initialState, ...initialEffects]] = useState(() => init(initial))
  const [state, setState] = useState(initialState)
  const mutState = useRef(state)
  const isRunning = useRef(true)
  const effects = useRef(initialEffects)

  const [actions] = useState(() =>
    Object.fromEntries(
      Object.entries(update).map(([tag, up]) => [
        tag,
        (...args: readonly never[]) => {
          if (isRunning.current) {
            const [nextState, ...nextEffects] = up(mutState.current, ...args)
            if (nextState !== mutState.current) {
              mutState.current = nextState
              setState(nextState)
            }
            effects.current.unshift(...nextEffects)
            while (effects.current.length > 0) {
              effects.current.shift()?.(dependencies, actions)
            }
          }
        }
      ])
    )
  )

  useEffect(() => {
    while (effects.current.length > 0) {
      effects.current.shift()?.(dependencies, actions)
    }

    return () => {
      isRunning.current = false
      effects.current = []
    }
  }, [])

  return [state, actions]
}

type ActionMap<Action extends readonly [string, ...unknown[]]> = PrettyType<
  UnionToIntersection<
    Action extends readonly [infer ActionTag, ...infer ActionParams]
      ? ActionTag extends string
        ? Readonly<Record<ActionTag, (...args: ActionParams) => void>>
        : never
      : never
  >
>

type Effect<
  Action extends readonly [string, ...unknown[]],
  Deps extends Readonly<Record<string, unknown>>
> = (deps: Deps, actions: ActionMap<Action>) => void

export type Command<
  State,
  Action extends readonly [string, ...unknown[]],
  Deps extends Readonly<Record<string, unknown>>
> = readonly [State, ...(readonly Effect<Action, Deps>[])]

export type Update<
  State,
  Action extends readonly [string, ...unknown[]],
  Deps extends Readonly<Record<string, unknown>>
> = UpdateMapImpl<DeepReadonly<State>, Action, Deps, Action>

type UpdateMapImpl<
  State,
  Action extends readonly [string, ...unknown[]],
  Deps extends Readonly<Record<string, unknown>>,
  CombinedAction extends Action
> = PrettyType<
  UnionToIntersection<
    Action extends readonly [infer Tag, ...infer Params]
      ? Tag extends string
        ? Readonly<
            Record<Tag, (state: State, ...args: Params) => Command<State, CombinedAction, Deps>>
          >
        : never
      : never
  >
>
