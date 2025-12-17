const HINT_CHARS = 'sadfjklewcmpgh'

export function indexToHint(index: number): string {
  const base = HINT_CHARS.length
  let hint = ''

  while (index >= 0 || hint.length < 2) {
    const mod = ((index % base) + base) % base
    hint = HINT_CHARS[mod] + hint
    index = Math.floor(index / base) - 1
  }

  return hint
}

// Sort elements top → bottom → left → right
export function sortByPosition<T extends { rect: DOMRect }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const ay = a.rect.top
    const by = b.rect.top
    if (ay !== by) return ay - by
    return a.rect.left - b.rect.left
  })
}

// Combine: sort + assign hints
export function assignHints<T extends { rect: DOMRect }>(
  items: T[],
): (T & { hint: string })[] {
  const sorted = sortByPosition(items)
  return sorted.map((item, i) => ({
    ...item,
    hint: indexToHint(i),
  }))
}
