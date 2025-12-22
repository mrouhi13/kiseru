chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return

  switch (msg.type) {
    case 'CLOSE_TAB':
      chrome.tabs.remove(sender.tab.id)
      break
    case 'UNDO_CLOSE_TAB':
      chrome.sessions.restore()
      break
    case 'GO_HOME':
      const url = new URL(sender.tab.url)
      chrome.tabs.update(sender.tab.id, { url: url.origin })
      break
    case 'GO_BACK':
      chrome.tabs.goBack(sender.tab.id)
      break
    case 'GO_FORWARD':
      chrome.tabs.goForward(sender.tab.id)
      break
    case 'NEXT_TAB':
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const index = tabs.findIndex((t) => t.active)
        const next = tabs[(index + 1) % tabs.length]
        chrome.tabs.update(next.id, { active: true })
      })
      break
    case 'PREV_TAB':
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const index = tabs.findIndex((t) => t.active)
        const prev = tabs[(index - 1 + tabs.length) % tabs.length]
        chrome.tabs.update(prev.id, { active: true })
      })
      break
    default:
      break
  }
})
