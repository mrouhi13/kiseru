import type { ClickableElement } from '../types/clickable'
import { cloneRect } from '../types/clickable'

/**
 * CSS selectors used to detect interactive elements.
 * Extendable if you add more elements later.
 */
const CLICKABLE_SELECTORS = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
] as const

/**
 * Determine if an HTMLElement is visible and interactable.
 */
function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el)

  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    style.pointerEvents === 'none'
  ) {
    return false
  }

  // Must be part of rendered layout
  if (!el.offsetParent) return false

  // Must have non-zero render area
  return el.offsetWidth > 0 && el.offsetHeight > 0
}

/**
 * Determine if an element is disabled via native or aria attributes.
 */
function isDisabled(el: HTMLElement): boolean {
  return el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true'
}

/**
 * Detect all clickable elements inside a container.
 *
 * Uses ParentNode so it safely supports:
 *   - document
 *   - shadow roots
 *   - document fragments
 *   - elements
 */
export function detectClickables(
  root: ParentNode = document,
): ClickableElement[] {
  const selector = CLICKABLE_SELECTORS.join(',')
  const elements = Array.from(root.querySelectorAll<HTMLElement>(selector))

  const results: ClickableElement[] = []

  for (const el of elements) {
    if (!isVisible(el)) continue
    if (isDisabled(el)) continue

    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue

    results.push({
      element: el,
      rect: cloneRect(rect), // stable snapshot
    })
  }

  return results
}
