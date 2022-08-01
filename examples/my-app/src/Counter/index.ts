import { LoadedCounter } from './LoadedCounter'
import { makeCounter } from './make-counter'

// eslint-disable-next-line no-null/no-null
const Loading = () => null

export const Counter = makeCounter(Loading, LoadedCounter)
