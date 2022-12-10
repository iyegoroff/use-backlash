import { useState, useEffect, useRef } from 'react'
import { createBacklash } from 'use-backlash'

export { ActionMap, Command, Effect, UpdateMap } from 'use-backlash'
export const useBacklash = createBacklash({ useState, useEffect, useRef })
