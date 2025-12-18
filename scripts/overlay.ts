import type { ClickableElement } from '../types/clickable'

const OVERLAY_ROOT_ID = 'k-overlay-root'

/**
 * Get (or lazily create) the root container for overlays.
 */
export function getOverlayRoot(): HTMLElement {
  let root = document.getElementById(OVERLAY_ROOT_ID) as HTMLElement | null

  if (!root) {
    root = document.createElement('div')
    root.id = OVERLAY_ROOT_ID

    Object.assign(root.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '2147483647',
      opacity: '1',
      transition: 'opacity 0.2s ease',
    })

    document.body.appendChild(root)
  }
  return root
}

/**
 * Remove all overlay nodes.
 * Avoids replacing the root itself (for stability).
 */
export function clearOverlays(): void {
  getOverlayRoot().innerHTML = ''
}

/**
 * Render styled overlay boxes with hint labels.
 * Uses fragment batching for maximum performance.
 */
export function renderOverlays(
  items: Array<ClickableElement & { hint: string }>,
): void {
  const root = getOverlayRoot()
  clearOverlays()

  const fragment = document.createDocumentFragment()

  for (const { rect, hint } of items) {
    const box = document.createElement('div')
    box.className = 'k-overlay'

    Object.assign(box.style, {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    })

    const badge = document.createElement('div')
    badge.className = 'k-hint-badge'
    badge.textContent = hint

    box.appendChild(badge)
    fragment.appendChild(box)
  }

  root.appendChild(fragment)
}

export function hideOverlays(): void {
  const root = getOverlayRoot()
  root.classList.add('k-overlay-hidden')
  root.style.opacity = '0'
}

export function showOverlays(): void {
  const root = getOverlayRoot()
  root.classList.remove('k-overlay-hidden')
  root.style.opacity = '1'
}
