import type { ImmutableRect } from '../types/clickable'

/**
 * Characters used in hint generation.
 * You can change these to any set (e.g., home-row only).
 */
export const HINT_CHARS = 'qwertypoiuasdfglkjhmnbvcz' as const
const BASE = HINT_CHARS.length

/**
 * Converts an index (0,1,2...) into a hint string (AA, AB, AC, ...).
 * Ensures minimum length = 2 for consistent UI alignment.
 */
export function indexToHint(index: number): string {
  let hint = ''

  // produce at least 2 characters by construction
  index += BASE // shift index so smallest value produces 2 digits

  while (index >= BASE) {
    const mod = index % BASE
    hint = HINT_CHARS[mod] + hint
    index = Math.floor(index / BASE) - 1
  }

  return HINT_CHARS[index] + hint
}

/**
 * Sort items top → bottom, then left → right.
 */
export function sortByPosition<T extends { rect: ImmutableRect }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const dy = a.rect.top - b.rect.top
    if (dy !== 0) return dy
    return a.rect.left - b.rect.left
  })
}

/**
 * Assign ordered human-readable hints to clickable items.
 */
export function assignHints<T extends { rect: ImmutableRect }>(
  items: T[],
): (T & { hint: string })[] {
  const sorted = sortByPosition(items)
  return sorted.map((item, i) => ({
    ...item,
    hint: indexToHint(i),
  }))
}
