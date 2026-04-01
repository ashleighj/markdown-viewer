import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchResult, SearchMatch } from '../types'
import { useFileTreeStore } from './fileTreeStore'
import { useWorkspaceStore } from './workspaceStore'
import { useIgnore } from '../composables/useIgnore'

interface IndexEntry {
  workspaceId: string
  workspaceName: string
  filePath: string
  handle: FileSystemFileHandle
  content: string
  lowerContent: string
}

export const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const searching = ref(false)
  const index = ref<IndexEntry[]>([])
  const indexing = ref(false)
  const active = computed(() => query.value.length > 0)

  let debounceTimer: number | null = null

  async function buildIndex() {
    indexing.value = true
    const fileTreeStore = useFileTreeStore()
    const workspaceStore = useWorkspaceStore()
    const entries: IndexEntry[] = []

    for (const ws of workspaceStore.workspaces) {
      const tree = fileTreeStore.getTree(ws.id)
      const files = fileTreeStore.flattenFiles(tree.nodes)
      const { isIgnored } = useIgnore(ws.ignorePatterns)

      for (const file of files) {
        if (isIgnored(file.path)) continue
        if (!file.handle) continue
        try {
          const fileObj = await file.handle.getFile()
          const content = await fileObj.text()
          entries.push({
            workspaceId: ws.id,
            workspaceName: ws.name,
            filePath: file.path,
            handle: file.handle,
            content,
            lowerContent: content.toLowerCase(),
          })
        } catch {
          // skip unreadable files
        }
      }
    }

    index.value = entries
    indexing.value = false
  }

  function search(q: string) {
    query.value = q
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!q.trim()) {
      results.value = []
      return
    }
    debounceTimer = window.setTimeout(() => executeSearch(q), 300)
  }

  function executeSearch(q: string) {
    searching.value = true
    const lowerQ = q.toLowerCase()
    const found: SearchResult[] = []

    for (const entry of index.value) {
      const matches: SearchMatch[] = []
      const lines = entry.content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase()
        const idx = lowerLine.indexOf(lowerQ)
        if (idx !== -1) {
          matches.push({ line: i + 1, text: lines[i], offset: idx })
          if (matches.length >= 3) break
        }
      }
      if (matches.length > 0) {
        found.push({
          workspaceId: entry.workspaceId,
          workspaceName: entry.workspaceName,
          filePath: entry.filePath,
          matches,
        })
      }
    }

    results.value = found
    searching.value = false
  }

  function clear() {
    query.value = ''
    results.value = []
  }

  return {
    query,
    results,
    searching,
    indexing,
    active,
    buildIndex,
    search,
    clear,
    index,
  }
})
