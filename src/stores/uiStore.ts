import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarVisible = ref(true)
  const sidebarWidth = ref(parseInt(localStorage.getItem('sidebarWidth') || '260'))
  const tocVisible = ref(localStorage.getItem('tocVisible') !== 'false')
  const showShortcutOverlay = ref(false)
  const showIgnoredFiles = ref(false)

  watch(sidebarWidth, (v) => localStorage.setItem('sidebarWidth', String(v)))
  watch(tocVisible, (v) => localStorage.setItem('tocVisible', String(v)))

  function toggleSidebar() { sidebarVisible.value = !sidebarVisible.value }
  function toggleToc() { tocVisible.value = !tocVisible.value }
  function toggleShortcutOverlay() { showShortcutOverlay.value = !showShortcutOverlay.value }
  function toggleIgnoredFiles() { showIgnoredFiles.value = !showIgnoredFiles.value }

  return {
    sidebarVisible,
    sidebarWidth,
    tocVisible,
    showShortcutOverlay,
    showIgnoredFiles,
    toggleSidebar,
    toggleToc,
    toggleShortcutOverlay,
    toggleIgnoredFiles,
  }
})
