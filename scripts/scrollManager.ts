/**
 * scrollManager.ts
 *
 * A clean abstraction for managing scroll listeners and invoking updates
 * in a throttled way. Eliminates duplicated logic inside the main content script.
 */

export type ScrollCallback = () => void

interface ScrollManagerState {
  scrollables: HTMLElement[]
  attached: boolean
  timeoutId: ReturnType<typeof setTimeout> | null
}

/**
 * A lightweight scroll manager for throttled scroll updates.
 */
export class ScrollManager {
  private state: ScrollManagerState = {
    scrollables: [],
    attached: false,
    timeoutId: null,
  }

  constructor(
    private readonly delay: number,
    private readonly onScrollUpdate: ScrollCallback,
    private readonly onScrollStart: () => void,
  ) {}

  /**
   * Throttles the update pass using setTimeout.
   */
  private triggerThrottledUpdate(): void {
    const { timeoutId } = this.state

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    this.state.timeoutId = setTimeout(() => {
      // Allow scroll updates to animate smoothly
      requestAnimationFrame(() => {
        this.onScrollUpdate()
      })
    }, this.delay)
  }

  /**
   * Internal scroll handler shared by window, document, and scrollable elements.
   */
  private handleScroll = (): void => {
    this.onScrollStart()
    this.triggerThrottledUpdate()
  }

  /**
   * Detect and listen to scrollable elements inside the DOM.
   */
  private detectScrollableElements(): HTMLElement[] {
    const results: HTMLElement[] = []
    const selector =
      'div, main, section, [style*="overflow"], [style*="scroll"]'

    const candidates = document.querySelectorAll<HTMLElement>(selector)

    for (const el of candidates) {
      const style = window.getComputedStyle(el)

      if (
        /(auto|scroll)/.test(style.overflow) ||
        /(auto|scroll)/.test(style.overflowY)
      ) {
        results.push(el)
      }
    }

    return results
  }

  /**
   * Activate scroll listeners (safe to call multiple times).
   */
  attach(): void {
    if (this.state.attached) return
    this.state.attached = true

    window.addEventListener('scroll', this.handleScroll, { passive: true })

    const scrollables = this.detectScrollableElements()
    this.state.scrollables = scrollables

    for (const el of scrollables) {
      el.addEventListener('scroll', this.handleScroll, { passive: true })
    }
  }

  /**
   * Remove all scroll listeners.
   */
  detach(): void {
    if (!this.state.attached) return
    this.state.attached = false

    window.removeEventListener('scroll', this.handleScroll)
    document.removeEventListener('scroll', this.handleScroll)

    for (const el of this.state.scrollables) {
      el.removeEventListener('scroll', this.handleScroll)
    }

    this.state.scrollables = []

    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId)
      this.state.timeoutId = null
    }
  }

  /**
   * Re-scan scrollable containers and re-attach listener bindings.
   * Useful when navigating to a new SPA route.
   */
  refresh(): void {
    this.detach()
    this.attach()
  }
}
