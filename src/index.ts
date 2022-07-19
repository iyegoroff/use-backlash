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
      ? (...args: Rest) => undefined
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
      actions: Readonly<Record<string, (...args: readonly never[]) => undefined>>
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
          actions: Readonly<Record<string, (...actionArgs: readonly never[]) => undefined>>
        ) => void)[]
      ]
    >
  >,
  Deps extends Readonly<Record<string, unknown>>,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0]
>(
  initial: Parameters<Init>[0],
  init: Init,
  update: UpdateMap,
  dependencies: Deps
): readonly [
  PrettyDeepReadonly<State>,
  Readonly<Record<string, (...args: readonly never[]) => undefined>>
] {
  const [[initialState, ...initialEffects]] = useState(() => init(initial))
  const [state, setState] = useState(initialState)
  const isRunning = useRef(true)
  const effects = useRef(initialEffects)

  const [actions] = useState(() =>
    Object.fromEntries(
      Object.entries(update).map(([tag, up]) => [
        tag,
        (...args: readonly never[]) => {
          if (isRunning.current) {
            const [nextState, ...nextEffects] = up(state, ...args)
            setState(nextState)
            effects.current.unshift(...nextEffects)
            while (effects.current.length > 0) {
              effects.current.shift()?.(dependencies, actions)
            }
          }

          return undefined
        }
      ])
    )
  )

  useEffect(() => {
    isRunning.current = false
    effects.current = []
  }, [])

  return [state, actions]
}

type ActionMap<Action extends readonly [string, ...unknown[]]> = PrettyType<
  UnionToIntersection<
    Action extends readonly [infer ActionTag, ...infer ActionParams]
      ? ActionTag extends string
        ? Readonly<Record<ActionTag, (...args: ActionParams) => undefined>>
        : never
      : never
  >
>

type Effect<
  Action extends readonly [string, ...unknown[]],
  Deps extends Readonly<Record<string, unknown>>
> = (deps: Deps, actions: ActionMap<Action>) => void

export type Command<
  Action extends readonly [string, ...unknown[]],
  State,
  Deps extends Readonly<Record<string, unknown>>
> = readonly [State, ...(readonly Effect<Action, Deps>[])]

export type Update<
  Action extends readonly [string, ...unknown[]],
  State,
  Deps extends Readonly<Record<string, unknown>>
> = UpdateMapImpl<Action, DeepReadonly<State>, Deps, Action>

type UpdateMapImpl<
  Action extends readonly [string, ...unknown[]],
  State,
  Deps extends Readonly<Record<string, unknown>>,
  CombinedAction extends Action
> = PrettyType<
  UnionToIntersection<
    Action extends readonly [infer Tag, ...infer Params]
      ? Tag extends string
        ? Readonly<
            Record<Tag, (state: State, ...args: Params) => Command<CombinedAction, State, Deps>>
          >
        : never
      : never
  >
>

// type Action = [tag: 'inc'] | [tag: 'dec'] | [tag: 'add', value: number]
// type State = { count: number; foo?: { x: 1 } } | { loading: true }
// type Deps = { storage: Storage }

// const init = (count: number) => [{ count }] as const

// const update = {
//   inc: (state: State) => ['loading' in state ? state : { count: state.count + 1 }] as const,
//   dec: (state: State) => ['loading' in state ? state : { count: state.count - 1 }] as const,
//   add: (state: State, value: number) =>
//     'loading' in state
//       ? ([state] as const)
//       : ([
//           { count: state.count + value },
//           ({ storage }: Deps) => {
//             storage.setItem('key', `${state.count + value}`)
//           }
//         ] as const)
// }

// const update2: Update<State, Action, Deps> = {
//   inc: (state) => ['loading' in state ? state : { count: state.count + 1 }],
//   dec: (state) => ['loading' in state ? state : { count: state.count - 1 }],
//   add: (state, value) =>
//     'loading' in state
//       ? [state]
//       : [
//           { count: state.count + value },
//           ({ storage }) => {
//             storage.setItem('key', `${state.count + value}`)
//           }
//         ]
// }

// const s1 = useBacklash(5, init, update, { storage: localStorage })
// const s2 = useBacklash(5, init, update2, { storage: localStorage })
