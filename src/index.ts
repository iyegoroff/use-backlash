import { useState, useEffect, useRef } from 'react'

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

type PrettyType<V> = V extends (...args: never[]) => unknown
  ? V
  : Extract<{ [K in keyof V]: V[K] }, unknown>

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer V>
  ? ReadonlySet<DeepReadonly<V>>
  : { readonly [P in keyof T]: DeepReadonly<T[P]> }

type PrettyDeepReadonly<T> = DeepReadonly<T>

// type PrettyDeepReadonly<T> = PrettyType<{ readonly [P in keyof T]: PrettyDeepReadonly<T[P]> }>

type NeverMap = Readonly<Record<string, never>>

type UnknownMap = Readonly<Record<string, unknown>>

export function useBacklash<
  Init extends () => readonly [State, ...((actions: ActionMap, injects: InjectMap) => void)[]],
  UpdateMap extends Readonly<
    Record<
      string,
      (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state: any,
        ...args: never[]
      ) => readonly [State, ...((actions: ActionMap, injects: InjectMap) => void)[]]
    >
  >,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0],
  ActionMap extends {
    readonly [Key in keyof UpdateMap]: Parameters<UpdateMap[Key]> extends [unknown, ...infer Rest]
      ? (...args: Rest) => void
      : never
  },
  InjectMap extends UnknownMap = NeverMap
>(
  init: Init,
  update: UpdateMap,
  injects?: InjectMap
): readonly [PrettyDeepReadonly<State>, ActionMap]

export function useBacklash<
  Init extends () => readonly [
    State,
    ...((
      actions: Readonly<Record<string, (...args: readonly never[]) => void>>,
      injectMap: UnknownMap
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
          actions: Readonly<Record<string, (...actionArgs: readonly never[]) => void>>,
          injectMap: UnknownMap
        ) => void)[]
      ]
    >
  >,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0],
  InjectMap extends UnknownMap
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
      actions: Readonly<Record<string, (...args: readonly never[]) => void>>,
      injectMap: InjectMap
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
          actions: Readonly<Record<string, (...actionArgs: readonly never[]) => void>>,
          injectMap: InjectMap
        ) => void)[]
      ]
    >
  >,
  State extends Parameters<UpdateMap[keyof UpdateMap]>[0],
  InjectMap extends UnknownMap
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
  const isInit = useRef(false)
  const effects = useRef(initialEffects)
  const deps = useRef(injects)

  useEffect(() => {
    deps.current = injects
  }, [injects])

  const [actions] = useState(() =>
    Object.fromEntries(
      Object.entries(update).map(([tag, up]) => [
        tag,
        (...args: readonly never[]) => {
          if (isRunning.current) {
            const effs = effects.current

            while (!isInit.current && effs.length > 0) effs.pop()?.(actions, deps.current)

            isInit.current = true

            const [nextState, ...nextEffects] = up(mutState.current, ...args)

            if (nextState !== mutState.current) {
              mutState.current = nextState
              setState(nextState)
            }

            effs.unshift(...nextEffects)

            while (effs.length > 0) effs.shift()?.(actions, deps.current)
          }
        }
      ])
    )
  )

  useEffect(() => {
    isRunning.current = true

    const effs = effects.current

    while (effs.length > 0) effs.pop()?.(actions, deps.current)

    isInit.current = true

    return () => {
      isRunning.current = false
      isInit.current = false
      effects.current = []
    }
  }, [actions])

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
  InjectMap extends UnknownMap = NeverMap
> = (actions: ActionMap<Action>, injects: DeepReadonly<InjectMap>) => void

export type Command<
  State,
  Action extends readonly [string, ...unknown[]],
  InjectMap extends UnknownMap = NeverMap
> = readonly [State, ...(readonly Effect<Action, DeepReadonly<InjectMap>>[])]

export type UpdateMap<
  State,
  Action extends readonly [string, ...unknown[]],
  InjectMap extends UnknownMap = NeverMap
> = UpdateMapImpl<DeepReadonly<State>, Action, InjectMap, Action>

type UpdateMapImpl<
  State,
  Action extends readonly [string, ...unknown[]],
  InjectMap extends UnknownMap,
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
