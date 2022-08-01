import React from 'react'
import { useBacklash } from 'use-backlash'
import { injects } from './common'
import { CounterState, init, update } from './state'

export function makeCounter<LoadingProps, ReadyProps>(
  Loading: React.ComponentType<LoadingProps>,
  Ready: React.ComponentType<ReadyProps & { initial: Exclude<CounterState, 'loading'> }>
) {
  return (props: ReadyProps & LoadingProps) => {
    const [state] = useBacklash(init, update, injects)

    return state === 'loading' ? <Loading {...props} /> : <Ready {...props} initial={state} />
  }
}

// export const Counter = switchBacklash([init, update, injects], (x, y) => <></>)

// export function switchBacklash<Params extends Parameters<typeof useBacklash>>(
//   params: Params,
//   render: (state: ReturnType<Params[0]>[0], actions: any) => React.ReactNode
// ) {
//   return () => {
//     const [state, actions] = useBacklash(params[0], params[1], params[2])

//     return render(state, actions)
//   }
// }

// type Intersection<A, B> =
//   | { [Key in keyof A]: Key extends keyof B ? Key : never }[keyof A]
//   | { [Key in keyof B]: Key extends keyof A ? Key : never }[keyof B]
