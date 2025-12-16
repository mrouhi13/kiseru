import type { ClickableElement } from '../types/clickable'

const SELECTORS = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
]

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    el.offsetWidth > 0 &&
    el.offsetHeight > 0
  )
}

function isDisabled(el: HTMLElement): boolean {
  return (el as HTMLButtonElement).disabled
}

export function detectClickables(
  root: Document = document,
): ClickableElement[] {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>(SELECTORS.join(',')),
  )

  return elements
    .filter(isVisible)
    .filter((el) => !isDisabled(el))
    .map((el) => ({
      element: el,
      rect: el.getBoundingClientRect(),
    }))
}
