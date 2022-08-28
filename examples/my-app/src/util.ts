import { ChangeEvent } from 'react'

export const noop = () => {
  /* */
}

export const changeEventValue = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => value

export type MapKey<M> = M extends ReadonlyMap<infer Key, unknown> ? Key : never

export type MapValue<M> = M extends ReadonlyMap<unknown, infer Value> ? Value : never
