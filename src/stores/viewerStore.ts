import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useViewerStore = defineStore('viewer', () => {
  const activeWorkspaceId = ref<string | null>(null)
  const activeFilePath = ref<string | null>(null)
  const content = ref<string>('')
  const renderedHtml = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const fileSize = ref(0)
  const showLargeFileWarning = ref(false)

  const FILE_SIZE_WARN = 500 * 1024 // 500KB

  async function openFile(handle: FileSystemFileHandle, filePath: string) {
    loading.value = true
    error.value = null
    showLargeFileWarning.value = false
    try {
      const file = await handle.getFile()
      fileSize.value = file.size
      if (file.size > FILE_SIZE_WARN) {
        showLargeFileWarning.value = true
        loading.value = false
        return
      }
      content.value = await file.text()
    } catch (e: any) {
      error.value = e.message || 'Failed to read file'
      content.value = ''
    } finally {
      loading.value = false
    }
    activeFilePath.value = filePath
  }

  async function forceOpenLargeFile(handle: FileSystemFileHandle, filePath: string) {
    loading.value = true
    showLargeFileWarning.value = false
    try {
      const file = await handle.getFile()
      content.value = await file.text()
    } catch (e: any) {
      error.value = e.message || 'Failed to read file'
      content.value = ''
    } finally {
      loading.value = false
    }
    activeFilePath.value = filePath
  }

  function clearContent() {
    content.value = ''
    renderedHtml.value = ''
    activeFilePath.value = null
    error.value = null
    showLargeFileWarning.value = false
  }

  // Update browser tab title
  watch(activeFilePath, (path) => {
    if (path) {
      const fileName = path.split('/').pop() || path
      document.title = `${fileName} — Markdown Viewer`
    } else {
      document.title = 'Markdown Viewer'
    }
  })

  return {
    activeWorkspaceId,
    activeFilePath,
    content,
    renderedHtml,
    loading,
    error,
    fileSize,
    showLargeFileWarning,
    openFile,
    forceOpenLargeFile,
    clearContent,
  }
})
