import { detectClickables } from './detector'
import { hideOverlays, renderOverlays, showOverlays } from './overlay'
import { assignHints } from './hints'

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
let updateTimeout: number | null = null
let scrollTimeout: number | null = null
let isOverlayUpdating = false
let mutationPending = false
let scrollListenersAttached = false
let scrollableElements: HTMLElement[] = []

function enableNavMode() {
  if (mode === Mode.NAV) return
  mode = Mode.NAV

  scrollListenersAttached = false
  attachScrollListeners()
  observer.observe(document.body, { childList: true, subtree: true })

  requestAnimationFrame(() => {
    updateOverlays()
    showOverlays()
  })
}

function disableNavMode() {
  if (mode === Mode.NORMAL) return
  mode = Mode.NORMAL

  detachScrollListeners()
  observer.disconnect()

  if (scrollTimeout) clearTimeout(scrollTimeout)
  if (updateTimeout) clearTimeout(updateTimeout)

  mutationPending = false
  isOverlayUpdating = false

  hideOverlays()
}

function debouncedUpdate(): void {
  if (updateTimeout) clearTimeout(updateTimeout)
  updateTimeout = window.setTimeout(updateOverlays, UPDATE_DELAY)
}

function updateOverlays(): void {
  if (mode === Mode.NORMAL) return

  isOverlayUpdating = true
  const clickables = assignHints(detectClickables())

  hintMap.clear()
  for (const c of clickables) hintMap.set(c.hint, c.element)

  renderOverlays(clickables)
  requestAnimationFrame(() => (isOverlayUpdating = false))
}

// Initial render (no overlays shown until Nav Mode is ON)
updateOverlays()

function handleScroll() {
  if (mode === Mode.NORMAL) return

  hideOverlays()

  if (scrollTimeout) clearTimeout(scrollTimeout)

  scrollTimeout = window.setTimeout(() => {
    if (mode === Mode.NORMAL) return

    const clickables = assignHints(
      detectClickables().filter((c) => {
        const top = c.rect.top
        const bottom = c.rect.bottom
        return bottom >= 0 && top <= window.innerHeight
      }),
    )

    hintMap.clear()
    for (const c of clickables) hintMap.set(c.hint, c.element)

    renderOverlays(clickables)
    requestAnimationFrame(showOverlays)
  }, UPDATE_DELAY)
}

function attachScrollListeners() {
  if (scrollListenersAttached) return
  scrollListenersAttached = true

  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('scroll', handleScroll, { passive: true })

  scrollableElements = []

  const candidates = document.querySelectorAll<HTMLElement>(
    'div, main, section, [style*="overflow"], [style*="scroll"]',
  )

  candidates.forEach((el) => {
    const style = window.getComputedStyle(el)
    if (
      /(auto|scroll)/.test(style.overflow) ||
      /(auto|scroll)/.test(style.overflowY)
    ) {
      el.addEventListener('scroll', handleScroll, { passive: true })
      scrollableElements.push(el)
    }
  })
}

// NEW: detach scroll listeners when NAV mode is off
function detachScrollListeners() {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('scroll', handleScroll)

  for (const el of scrollableElements) {
    el.removeEventListener('scroll', handleScroll)
  }

  scrollListenersAttached = false
  scrollableElements = []
}

// Attach listeners after page loads (only matters once)
setTimeout(attachScrollListeners, UPDATE_DELAY)

// MutationObserver (throttled)
const observer = new MutationObserver((mutations) => {
  if (mode === Mode.NORMAL) return
  if (isOverlayUpdating || mutationPending) return

  const root = document.getElementById('k-overlay-root')
  if (!root) return

  for (const m of mutations) {
    if (m.target === root || root.contains(m.target)) return
  }

  mutationPending = true
  requestAnimationFrame(() => {
    mutationPending = false
    debouncedUpdate()
  })
})

observer.observe(document.body, { childList: true, subtree: true })

// URL change detection (no polling)
function onUrlChange() {
  if (location.href !== lastUrl) {
    lastUrl = location.href

    if (mode === Mode.NORMAL) return

    debouncedUpdate()
    scrollListenersAttached = false
    setTimeout(attachScrollListeners, UPDATE_DELAY) // reattach for new pages/components
  }
}

function simulateClick(el: HTMLElement) {
  el.focus()
  const rect = el.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  for (const type of ['mousedown', 'mouseup', 'click']) {
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

function enterHintMode() {
  if (!hintMode) {
    hintMode = true
    currentTypedHint = ''
  }
}

function exitHintMode() {
  if (hintMode) {
    hintMode = false
    currentTypedHint = ''
  }
}

const originalPushState = history.pushState
history.pushState = function (...args) {
  const r = originalPushState.apply(this, args)
  onUrlChange()
  return r
}

const originalReplaceState = history.replaceState
history.replaceState = function (...args) {
  const r = originalReplaceState.apply(this, args)
  onUrlChange()
  return r
}

window.addEventListener('popstate', onUrlChange)

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase()

  // Toggle Nav Mode
  if (key === 'alt') {
    e.preventDefault()
    if (mode === Mode.NORMAL) enableNavMode()
    else disableNavMode()
    return
  }

  // Ignore everything in NORMAL mode
  if (mode === Mode.NORMAL) return

  // Prevent site keybindings in NAV mode
  e.stopImmediatePropagation()
  e.preventDefault()

  // Enter Hint Mode
  if (key === 'f') {
    enterHintMode()
    return
  }

  // Escape exits Hint Mode
  if (key === 'escape') {
    exitHintMode()
    return
  }

  // If not in Hint Mode → ignore typing
  if (!hintMode) return

  // Accept only A–Z for hint typing
  if (!/^[a-z]$/.test(key)) return
  // Build typed hint
  currentTypedHint += key

  // Match?
  const el = hintMap.get(currentTypedHint)
  if (el) {
    const href = el instanceof HTMLAnchorElement ? el.href : el.getAttribute('href')

    const ctrl = e.ctrlKey || e.metaKey

    currentTypedHint = ''

    if (ctrl) {
      if (href) window.open(href, '_blank')
      else {
        const dataHref = el.getAttribute('data-href')
        if (dataHref) window.open(dataHref, '_blank')
      }
    } else {
      simulateClick(el)
    }

    return
  }

  const hasPrefix = Array.from(hintMap.keys()).some((h) =>
    h.startsWith(currentTypedHint),
  )

  if (!hasPrefix) currentTypedHint = ''
})

window.addEventListener('focusin', (e) => {
  if (mode === Mode.NAV) {
    e.stopImmediatePropagation()
    e.preventDefault()
  }
}, true)
