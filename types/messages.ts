export type BackgroundMessage =
  | { type: 'NEW_TAB' }
  | { type: 'CLOSE_TAB' }
  | { type: 'UNDO_CLOSE_TAB' }
  | { type: 'GO_HOME' }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'RELOAD_TAB' }
  | { type: 'NEXT_TAB' }
  | { type: 'PREV_TAB' }

/**
 * Type guard for BackgroundMessage
 */
export function isBackgroundMessage(msg: unknown): msg is BackgroundMessage {
  if (!msg || typeof msg !== 'object') return false
  const t = (msg as any).type
  return (
    t === 'NEW_TAB' ||
    t === 'CLOSE_TAB' ||
    t === 'UNDO_CLOSE_TAB' ||
    t === 'GO_HOME' ||
    t === 'GO_BACK' ||
    t === 'GO_FORWARD' ||
    t === 'RELOAD_TAB' ||
    t === 'NEXT_TAB' ||
    t === 'PREV_TAB'
  )
}
