import { detectClickables } from './detector'
import {
  clearOverlays,
  getOverlayRoot,
  hideOverlays,
  renderOverlays,
  showOverlays,
} from './overlay'

let lastUrl = location.href
let updateTimeout: number | null = null
let scrollTimeout: number | null = null
let isOverlayUpdating = false

function debouncedUpdate(): void {
  if (updateTimeout) clearTimeout(updateTimeout)
  updateTimeout = window.setTimeout(updateOverlays, 80)
}

function updateOverlays(): void {
  isOverlayUpdating = true
  const clickables = detectClickables()
  clearOverlays()
  renderOverlays(clickables)
  requestAnimationFrame(() => (isOverlayUpdating = false))
}

// Initial render
updateOverlays()

function handleScroll() {
  hideOverlays()

  if (scrollTimeout) clearTimeout(scrollTimeout)

  scrollTimeout = window.setTimeout(() => {
    updateOverlays()
    requestAnimationFrame(showOverlays)
  }, 150)
}

function attachScrollListeners() {
  // Always attach to window + document
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('scroll', handleScroll, { passive: true })

  document.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const style = window.getComputedStyle(el)
    const scrollable =
      /(auto|scroll)/.test(style.overflow) ||
      /(auto|scroll)/.test(style.overflowY)

    if (scrollable) {
      el.addEventListener('scroll', handleScroll, { passive: true })
    }
  })
}

// Attach listeners AFTER page loads
setTimeout(attachScrollListeners, 300)

const observer = new MutationObserver((mutations) => {
  if (isOverlayUpdating) return

  const root = getOverlayRoot()

  for (const m of mutations) {
    if (m.target === root || root.contains(m.target)) continue
    if (!m.addedNodes.length && !m.removedNodes.length) continue
    debouncedUpdate()
    return
  }
})

observer.observe(document.body, { childList: true, subtree: true })

function onUrlChange(): void {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    debouncedUpdate()
    setTimeout(attachScrollListeners, 300) // reattach for new pages/components
  }
}

setInterval(onUrlChange, 500)

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
