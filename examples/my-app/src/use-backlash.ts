import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createBacklash } from 'use-backlash'

export { ActionMap, Command, Effect, UpdateMap } from 'use-backlash'
export const useBacklash = createBacklash({ useState, useEffect, useLayoutEffect, useRef })
