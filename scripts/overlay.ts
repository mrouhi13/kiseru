import type { ClickableElement } from '../types/clickable'

const OVERLAY_CLASS = 'k-overlay'
const OVERLAY_ROOT_ID = 'k-overlay-root'

/**
 * Get or create the overlay root container
 */
function getOverlayRoot(): HTMLElement {
  let root = document.getElementById(OVERLAY_ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = OVERLAY_ROOT_ID

    // Functional inline styles
    root.style.position = 'absolute'
    root.style.top = '0'
    root.style.left = '0'
    root.style.width = '100%'
    root.style.height = '100%'
    root.style.pointerEvents = 'none'
    root.style.zIndex = '2147483647'

    document.body.appendChild(root)
  }
  return root
}

/**
 * Remove all overlay elements
 */
export function clearOverlays(): void {
  const root = getOverlayRoot()
  root.innerHTML = ''
}

/**
 * Render overlays for given clickable elements
 */
export function renderOverlays(items: ClickableElement[]): void {
  const root = getOverlayRoot()
  clearOverlays()

  const fragment = document.createDocumentFragment()
  for (const { rect } of items) {
    const overlay = document.createElement('div')
    overlay.className = OVERLAY_CLASS
    overlay.style.top = `${rect.top + window.scrollY}px`
    overlay.style.left = `${rect.left + window.scrollX}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
    fragment.appendChild(overlay)
  }

  root.appendChild(fragment)
}
