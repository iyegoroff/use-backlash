export type Injects = { store: (item: string) => void; load: () => string | undefined }

const key = 'counter'

const store = (item: string) => localStorage.setItem(key, item)

const load = () => localStorage.getItem(key) ?? undefined

export const injects: Injects = { store, load }
