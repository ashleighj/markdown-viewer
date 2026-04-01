import { onMounted, onUnmounted } from 'vue'
import { useUiStore } from '../stores/uiStore'

export function useKeyboardShortcuts() {
  const ui = useUiStore()

  function handler(e: KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey

    // Cmd+B: toggle sidebar
    if (meta && e.key === 'b') {
      e.preventDefault()
      ui.toggleSidebar()
      return
    }

    // Cmd+\: toggle TOC
    if (meta && e.key === '\\') {
      e.preventDefault()
      ui.toggleToc()
      return
    }

    // Cmd+F: focus search
    if (meta && e.key === 'f') {
      e.preventDefault()
      const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]')
      if (searchInput) {
        ui.sidebarVisible = true
        searchInput.focus()
      }
      return
    }

    // Cmd+Shift+E: focus file tree
    if (meta && e.shiftKey && e.key === 'E') {
      e.preventDefault()
      ui.sidebarVisible = true
      const tree = document.querySelector<HTMLElement>('[data-file-tree]')
      if (tree) tree.focus()
      return
    }

    // ? or Cmd+/: shortcut overlay
    if (e.key === '?' || (meta && e.key === '/')) {
      e.preventDefault()
      ui.toggleShortcutOverlay()
      return
    }

    // Escape: close overlays / clear search
    if (e.key === 'Escape') {
      if (ui.showShortcutOverlay) {
        ui.showShortcutOverlay = false
        return
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onUnmounted(() => window.removeEventListener('keydown', handler))
}
