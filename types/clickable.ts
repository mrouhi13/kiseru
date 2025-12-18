/**
 * A safe, immutable rectangle used by the overlay system.
 * DOMRect can change between frames (live object), so we clone its values.
 */
export interface ImmutableRect {
  readonly x: number
  readonly y: number
  readonly top: number
  readonly left: number
  readonly bottom: number
  readonly right: number
  readonly width: number
  readonly height: number
}

/**
 * A clickable DOM element and its stable, snapshot rectangle.
 */
export interface ClickableElement {
  readonly element: HTMLElement
  readonly rect: ImmutableRect
}

/**
 * Clone a real DOMRect into a safe, immutable object.
 */
export function cloneRect(r: DOMRect): ImmutableRect {
  return {
    x: r.x,
    y: r.y,
    top: r.top,
    left: r.left,
    bottom: r.bottom,
    right: r.right,
    width: r.width,
    height: r.height,
  }
}
