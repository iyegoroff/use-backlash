export const Persistence = (key: string) => ({
  load: () => localStorage.getItem(key) ?? undefined,

  store: (value: string) => localStorage.setItem(key, value)
})
