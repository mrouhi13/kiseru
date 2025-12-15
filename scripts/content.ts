import { detectClickables } from './detector';
import { renderOverlays, clearOverlays } from './overlay';

let lastUrl = location.href;
let updateTimeout: number | null = null;

/**
 * Debounced update to prevent infinite loops
 */
function debouncedUpdate() {
  if (updateTimeout) clearTimeout(updateTimeout);
  updateTimeout = window.setTimeout(() => {
    updateOverlays();
  }, 100);
}

/**
 * Update overlays based on current DOM
 */
function updateOverlays(): void {
  const clickables = detectClickables();
  renderOverlays(clickables);
}

/**
 * Handle SPA URL changes
 */
function onUrlChange(): void {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    clearOverlays();
    debouncedUpdate();
  }
}

// Initial render
updateOverlays();

// ------------------------------
// MutationObserver for dynamic DOM changes
// ------------------------------
const observer = new MutationObserver((mutations) => {
  const root = document.getElementById('k-overlay-root');
  if (!root) return;

  // Ignore mutations inside overlay root to prevent infinite loop
  if (mutations.some(m => Array.from(m.addedNodes).some(n => root.contains(n)))) {
    return;
  }

  debouncedUpdate();
});
observer.observe(document.body, { childList: true, subtree: true });

// ------------------------------
// Update overlays on scroll and resize (debounced)
// ------------------------------
window.addEventListener('scroll', debouncedUpdate, { passive: true });
window.addEventListener('resize', debouncedUpdate);

// ------------------------------
// SPA URL-change detection (debounced)
// ------------------------------
setInterval(onUrlChange, 500);

// Monkey-patch pushState/replaceState
const originalPushState = history.pushState;
history.pushState = function (...args) {
  const result = originalPushState.apply(this, args);
  onUrlChange();
  return result;
};

const originalReplaceState = history.replaceState;
history.replaceState = function (...args) {
  const result = originalReplaceState.apply(this, args);
  onUrlChange();
  return result;
};

window.addEventListener('popstate', onUrlChange);
