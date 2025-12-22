import { detectClickables } from './detector'
import { assignHints, HINT_CHARS } from './hints'
import { hideOverlays, renderOverlays, showOverlays } from './overlay'
import type { BackgroundMessage } from '../types/messages'
import { ScrollManager } from './scrollManager'

const UPDATE_DELAY = 120
const TOGGLE_KEY = ';'

enum Mode {
  NORMAL = 'normal',
  NAV = 'nav',
}

let mode: Mode = Mode.NORMAL
let currentTypedHint = ''
let hintMap = new Map<string, HTMLElement>()
let updatePending = false
let mutationPending = false

const scrollManager = new ScrollManager(
  UPDATE_DELAY,
  () => {
    updateOverlays()
    showOverlays()
  },
  hideOverlays,
)

const observer = new MutationObserver((mutations) => {
  if (mode === Mode.NORMAL || mutationPending) return

  const root = document.getElementById('k-overlay-root')
  if (!root) return

  for (const m of mutations) {
    if (root.contains(m.target as Node)) return
  }

  mutationPending = true
  requestAnimationFrame(() => {
    mutationPending = false
    scheduleUpdate()
  })
})

function scheduleUpdate(): void {
  if (updatePending) return
  updatePending = true
  requestAnimationFrame(() => {
    updatePending = false
    updateOverlays()
  })
}

function updateOverlays(): void {
  if (mode === Mode.NORMAL) return

  const clickables = assignHints(detectClickables(document.body))
  hintMap.clear()
  for (const c of clickables) hintMap.set(c.hint, c.element)

  renderOverlays(clickables)
}

function enableNavMode(): void {
  mode = Mode.NAV
  currentTypedHint = ''

  scrollManager.attach()
  observer.observe(document.body, { childList: true, subtree: true })

  requestAnimationFrame(() => {
    updateOverlays()
    showOverlays()
  })
}

function disableNavMode(): void {
  mode = Mode.NORMAL
  currentTypedHint = ''

  scrollManager.detach()
  observer.disconnect()
  hintMap.clear()
  hideOverlays()
}

function toggleNavMode(): void {
  if (mode === Mode.NORMAL) {
    enableNavMode()
  } else {
    disableNavMode()
  }
}

function simulateClick(el: HTMLElement): void {
  if ('click' in el) {
    el.click()
    return
  }

  const rect = el.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  el.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    }),
  )
  el.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    }),
  )
  el.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    }),
  )
}

function sendToBackground(msg: BackgroundMessage): void {
  chrome.runtime.sendMessage(msg)
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

function handleNavCommand(key: string, e: KeyboardEvent): boolean {
  switch (key) {
    case ' ':
      window.scrollBy({
        top: e.shiftKey ? -window.innerHeight * 0.8 : window.innerHeight * 0.8,
        behavior: 'smooth',
      })
      return true
    case 'h':
      if (e.shiftKey) {
        sendToBackground({ type: 'GO_HOME' })
        return true
      }
      break
    case 'x':
      sendToBackground({ type: e.shiftKey ? 'UNDO_CLOSE_TAB' : 'CLOSE_TAB' })
      return true
    case '<':
      sendToBackground({ type: 'GO_BACK' })
      return true
    case '>':
      sendToBackground({ type: 'GO_FORWARD' })
      return true
    case '[':
      sendToBackground({ type: 'PREV_TAB' })
      return true
    case ']':
      sendToBackground({ type: 'NEXT_TAB' })
      return true
    default:
      return false
  }
}

window.addEventListener(
  'keydown',
  (e) => {
    const key = e.key.toLowerCase()

    if (key === 'escape') {
      disableNavMode()
      return
    }

    if (key === TOGGLE_KEY) {
      if (mode === Mode.NORMAL && isEditable(e.target)) return
      e.preventDefault()
      e.stopImmediatePropagation()
      toggleNavMode()
      return
    }

    if (mode === Mode.NORMAL) return

    e.preventDefault()
    e.stopImmediatePropagation()

    if (handleNavCommand(key, e)) return

    if (!HINT_CHARS.includes(key)) return

    currentTypedHint += key
    const el = hintMap.get(currentTypedHint)
    if (el) {
      currentTypedHint = ''

      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el.isContentEditable
      ) {
        el.focus()
        return
      }

      const href =
        el instanceof HTMLAnchorElement ? el.href : el.getAttribute('href')
      const ctrl = e.ctrlKey || e.metaKey

      if (href && ctrl) {
        window.open(href, '_blank')
      } else {
        simulateClick(el)
      }

      return
    }

    const hasPrefix = Array.from(hintMap.keys()).some((h) =>
      h.startsWith(currentTypedHint),
    )
    if (!hasPrefix) currentTypedHint = ''
  },
  { capture: true },
)

window.addEventListener(
  'focusin',
  (e) => {
    if (mode === Mode.NAV) {
      e.preventDefault()
      e.stopImmediatePropagation()
    }
  },
  true,
)
