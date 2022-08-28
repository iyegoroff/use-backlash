import { KeyboardEvent } from 'react'

export const handleInput = (
  confirm: (value: string) => void,
  cancel: () => void,
  { code, target }: KeyboardEvent
) => {
  if (code === 'Escape') {
    cancel()
  } else if (code === 'Enter' && target instanceof HTMLInputElement) {
    confirm(target.value)
    target.value = ''
  }
}
