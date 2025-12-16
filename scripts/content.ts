import { detectClickables } from './detector'
import { hideOverlays, renderOverlays, showOverlays } from './overlay'

const UPDATE_DELAY = 120

let lastUrl = location.href
let updateTimeout: number | null = null
let scrollTimeout: number | null = null
let isOverlayUpdating = false
let mutationPending = false
let scrollListenersAttached = false

function debouncedUpdate(): void {
  if (updateTimeout) clearTimeout(updateTimeout)
  updateTimeout = window.setTimeout(updateOverlays, UPDATE_DELAY)
}

function updateOverlays(): void {
  isOverlayUpdating = true
  const clickables = detectClickables()

  renderOverlays(clickables)
  requestAnimationFrame(() => (isOverlayUpdating = false))
}

// Initial render
updateOverlays()

function handleScroll() {
  hideOverlays()

  if (scrollTimeout) clearTimeout(scrollTimeout)

  scrollTimeout = window.setTimeout(() => {
    const clickables = detectClickables().filter((c) => {
      const top = c.rect.top
      const bottom = c.rect.bottom
      return bottom >= 0 && top <= window.innerHeight
    })

    renderOverlays(clickables)
    requestAnimationFrame(showOverlays)
  }, UPDATE_DELAY)
}

// Attach listeners only to real scrollable elements
function attachScrollListeners() {
  if (scrollListenersAttached) return
  scrollListenersAttached = true

  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('scroll', handleScroll, { passive: true })

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
    }
  })
}

// Attach listeners AFTER page loads
setTimeout(attachScrollListeners, UPDATE_DELAY)

// MutationObserver (throttled)
const observer = new MutationObserver((mutations) => {
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
    debouncedUpdate()
    scrollListenersAttached = false
    setTimeout(attachScrollListeners, UPDATE_DELAY) // reattach for new pages/components
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
