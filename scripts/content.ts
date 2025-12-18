import { detectClickables } from './detector'
import { assignHints } from './hints'
import { hideOverlays, renderOverlays, showOverlays } from './overlay'
import type { BackgroundMessage } from '../types/messages'
import { ScrollManager } from './scrollManager'

const UPDATE_DELAY = 120

enum Mode {
  NORMAL = 'normal',
  NAV = 'nav',
}

let mode: Mode = Mode.NAV
let hintMode = false
let currentTypedHint = ''
let hintMap: Map<string, HTMLElement> = new Map()
let lastUrl = location.href

// Overlay update control
let updatePending = false
let mutationPending = false

// Scroll manager instance
const scrollManager = new ScrollManager(UPDATE_DELAY, () => {
  updateOverlays()
  showOverlays()
})

// MutationObserver
const observer = new MutationObserver((mutations) => {
  if (mode === Mode.NORMAL) return
  if (updatePending || mutationPending) return

  const root = document.getElementById('k-overlay-root')
  if (!root) return

  // Skip overlay-internal mutations
  for (const m of mutations) {
    if (m.target === root || root.contains(m.target)) {
      return
    }
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

/**
 * Main update function: detect → assign hints → render.
 */
function updateOverlays(): void {
  if (mode === Mode.NORMAL) return

  const clickables = assignHints(detectClickables())

  hintMap.clear()
  for (const c of clickables) {
    hintMap.set(c.hint, c.element)
  }

  renderOverlays(clickables)
}

function enableNavMode(): void {
  if (mode === Mode.NAV) return
  mode = Mode.NAV

  scrollManager.attach()
  observer.observe(document.body, { childList: true, subtree: true })

  requestAnimationFrame(() => {
    updateOverlays()
    showOverlays()
  })
}

function disableNavMode(): void {
  if (mode === Mode.NORMAL) return
  mode = Mode.NORMAL

  scrollManager.detach()
  observer.disconnect()

  currentTypedHint = ''
  hintMode = false
  hintMap.clear()

  hideOverlays()
}

function toggleHintMode(): void {
  hintMode = !hintMode
  currentTypedHint = ''
}

function onUrlChange(): void {
  if (location.href === lastUrl) return
  lastUrl = location.href

  if (mode === Mode.NORMAL) return

  scheduleUpdate()
  scrollManager.refresh()
}

// Monkey-patch history methods
const originalPush = history.pushState
history.pushState = function (...args) {
  const r = originalPush.apply(this, args)
  onUrlChange()
  return r
}

const originalReplace = history.replaceState
history.replaceState = function (...args) {
  const r = originalReplace.apply(this, args)
  onUrlChange()
  return r
}

window.addEventListener('popstate', onUrlChange)

function simulateClick(el: HTMLElement): void {
  // Native click() handles most cases elegantly
  // Use synthesized events as fallback for custom widgets
  if ('click' in el) {
    el.click()
    return
  }

  const rect = el.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  for (const type of ['mousedown', 'mouseup', 'click'] as const) {
    el.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window,
      }),
    )
  }
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase()

  // Toggle overall NAV mode
  if (key === 'alt') {
    e.preventDefault()
    if (mode === Mode.NORMAL) {
      enableNavMode()
    } else {
      disableNavMode()
    }
    return
  }

  if (mode === Mode.NORMAL) return

  // Block site shortcuts
  e.stopImmediatePropagation()
  e.preventDefault()

  // Escape toggles hint mode
  if (key === 'escape') {
    toggleHintMode()
    return
  }

  if (!hintMode) {
    switch (key) {
      case ' ':
        window.scrollBy({
          top: e.shiftKey
            ? -window.innerHeight * 0.8
            : window.innerHeight * 0.8,
          behavior: 'smooth',
        })
        return

      case 'h':
        sendToBackground({ type: 'GO_HOME' })
        return

      case 't':
        sendToBackground({ type: 'NEW_TAB' })
        return

      case 'q':
        sendToBackground({
          type: e.shiftKey ? 'UNDO_CLOSE_TAB' : 'CLOSE_TAB',
        })
        return

      case '<':
        sendToBackground({ type: 'GO_BACK' })
        return

      case '>':
        sendToBackground({ type: 'GO_FORWARD' })
        return

      case 'r':
        sendToBackground({ type: 'RELOAD_TAB' })
        return

      case '[':
        sendToBackground({ type: 'PREV_TAB' })
        return

      case ']':
        sendToBackground({ type: 'NEXT_TAB' })
        return
    }
  }

  if (!hintMode) return
  if (!/^[a-z]$/.test(key)) return

  currentTypedHint += key

  const el = hintMap.get(currentTypedHint)
  if (el) {
    const href =
      el instanceof HTMLAnchorElement ? el.href : el.getAttribute('href')
    const ctrl = e.ctrlKey || e.metaKey

    currentTypedHint = ''

    if (ctrl && href) {
      window.open(href, '_blank')
    } else {
      simulateClick(el)
    }

    return
  }

  // If no prefix matches, reset typed hint
  const hasPrefix = Array.from(hintMap.keys()).some((h) =>
    h.startsWith(currentTypedHint),
  )

  if (!hasPrefix) currentTypedHint = ''
})

// Prevent focus changes while in NAV mode
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

function sendToBackground(msg: BackgroundMessage): void {
  chrome.runtime.sendMessage(msg)
}

// Initial overlay compute (in case page loads partially)
scheduleUpdate()
