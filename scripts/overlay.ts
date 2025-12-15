import type { ClickableElement } from '../types/clickable';

const OVERLAY_CLASS = 'k-overlay';

export function clearOverlays(): void {
  document.querySelectorAll(`.${OVERLAY_CLASS}`).forEach(el => el.remove());
}

export function renderOverlays(items: ClickableElement[]): void {
  clearOverlays();

  const fragment = document.createDocumentFragment();

  for (const { rect } of items) {
    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;

    fragment.appendChild(overlay);
  }

  document.body.appendChild(fragment);
}
