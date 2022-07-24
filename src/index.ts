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
  Init extends () => readonly [State, ...((injects: InjectMap, actions: ActionMap) => void)[]],
  UpdateMap extends Readonly<
    Record<
      string,
      (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state: any,
        ...args: never[]
      ) => readonly [State, ...((injects: InjectMap, actions: ActionMap) => void)[]]
    >
  >,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0],
  ActionMap extends {
    readonly [Key in keyof UpdateMap]: Parameters<UpdateMap[Key]> extends [unknown, ...infer Rest]
      ? (...args: Rest) => void
      : never
  },
  InjectMap extends Readonly<Record<string, unknown>> = Readonly<Record<string, never>>
>(
  init: Init,
  update: UpdateMap,
  injects?: InjectMap
): readonly [PrettyDeepReadonly<State>, ActionMap]

export function useBacklash<
  Init extends () => readonly [
    State,
    ...((
      injectMap: Readonly<Record<string, unknown>>,
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
          injectMap: Readonly<Record<string, unknown>>,
          actions: Readonly<Record<string, (...actionArgs: readonly never[]) => void>>
        ) => void)[]
      ]
    >
  >,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0],
  InjectMap extends Readonly<Record<string, unknown>>
>(
  init: Init,
  update: UpdateMap,
  injects?: InjectMap
): readonly [
  PrettyDeepReadonly<State>,
  Readonly<Record<string, (...args: readonly never[]) => void>>
] {
  return useBacklashImpl(init, update, injects ?? {})
}

function useBacklashImpl<
  Init extends () => readonly [
    State,
    ...((
      injectMap: InjectMap,
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
          injectMap: InjectMap,
          actions: Readonly<Record<string, (...actionArgs: readonly never[]) => void>>
        ) => void)[]
      ]
    >
  >,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0],
  InjectMap extends Readonly<Record<string, unknown>>
>(
  init: Init,
  update: UpdateMap,
  injects: InjectMap
): readonly [
  PrettyDeepReadonly<State>,
  Readonly<Record<string, (...args: readonly never[]) => void>>
] {
  const [[initialState, ...initialEffects]] = useState(init)
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
            const effs = effects.current

            while (effs.length > 0) effs.pop()?.(injects, actions)

            const [nextState, ...nextEffects] = up(mutState.current, ...args)

            if (nextState !== mutState.current) {
              mutState.current = nextState
              setState(nextState)
            }

            effs.unshift(...nextEffects)

            while (effs.length > 0) effs.shift()?.(injects, actions)
          }
        }
      ])
    )
  )

  useEffect(() => {
    isRunning.current = true

    const effs = effects.current

    while (effs.length > 0) effs.pop()?.(injects, actions)

    return () => {
      isRunning.current = false
      effects.current = []
    }
  }, [])

  return [state, actions]
}

export type ActionMap<Action extends readonly [string, ...unknown[]]> = PrettyType<
  UnionToIntersection<
    Action extends readonly [infer ActionTag, ...infer ActionParams]
      ? ActionTag extends string
        ? Readonly<Record<ActionTag, (...args: ActionParams) => void>>
        : never
      : never
  >
>

export type Effect<
  Action extends readonly [string, ...unknown[]],
  InjectMap extends Readonly<Record<string, unknown>>
> = (injects: InjectMap, actions: ActionMap<Action>) => void

export type Command<
  State,
  Action extends readonly [string, ...unknown[]],
  InjectMap extends Readonly<Record<string, unknown>>
> = readonly [State, ...(readonly Effect<Action, InjectMap>[])]

export type UpdateMap<
  State,
  Action extends readonly [string, ...unknown[]],
  InjectMap extends Readonly<Record<string, unknown>>
> = UpdateMapImpl<DeepReadonly<State>, Action, InjectMap, Action>

type UpdateMapImpl<
  State,
  Action extends readonly [string, ...unknown[]],
  InjectMap extends Readonly<Record<string, unknown>>,
  CombinedAction extends Action
> = PrettyType<
  UnionToIntersection<
    Action extends readonly [infer Tag, ...infer Params]
      ? Tag extends string
        ? Readonly<
            Record<
              Tag,
              (state: State, ...args: Params) => Command<State, CombinedAction, InjectMap>
            >
          >
        : never
      : never
  >
>
