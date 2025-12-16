import type { ClickableElement } from '../types/clickable'

const OVERLAY_ROOT_ID = 'k-overlay-root'

export function getOverlayRoot(): HTMLElement {
  let root = document.getElementById(OVERLAY_ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = OVERLAY_ROOT_ID
    root.style.position = 'fixed'
    root.style.top = '0'
    root.style.left = '0'
    root.style.width = '100vw'
    root.style.height = '100vh'
    root.style.pointerEvents = 'none'
    root.style.zIndex = '2147483647'
    root.style.opacity = '1'
    root.style.transition = 'opacity 0.2s ease'
    document.body.appendChild(root)
  }
  return root
}

export function clearOverlays(): void {
  getOverlayRoot().innerHTML = ''
}

export function renderOverlays(items: ClickableElement[]): void {
  const root = getOverlayRoot()
  clearOverlays()

  const fragment = document.createDocumentFragment()

  for (const { rect } of items) {
    const overlay = document.createElement('div')
    overlay.className = 'k-overlay'
    overlay.style.position = 'fixed'
    overlay.style.top = `${rect.top}px`
    overlay.style.left = `${rect.left}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
    fragment.appendChild(overlay)
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
