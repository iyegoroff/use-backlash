const key = 'todos'

export const injects = {
  load: () => localStorage.getItem(key) ?? undefined,
  store: (item: string) => localStorage.setItem(key, item)
}
