import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, set, del, keys } from 'idb-keyval'
import type { Workspace } from '../types'

const WS_PREFIX = 'workspace:'

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([])
  const loading = ref(false)

  async function loadWorkspaces() {
    loading.value = true
    try {
      const allKeys = await keys()
      const wsKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(WS_PREFIX))
      const loaded: Workspace[] = []
      for (const key of wsKeys) {
        const ws = await get<Workspace>(key)
        if (ws) loaded.push(ws)
      }
      loaded.sort((a, b) => a.addedAt.localeCompare(b.addedAt))
      workspaces.value = loaded
    } finally {
      loading.value = false
    }
  }

  async function addWorkspace(handle: FileSystemDirectoryHandle): Promise<Workspace> {
    const ws: Workspace = {
      id: crypto.randomUUID(),
      name: handle.name,
      directoryHandle: handle,
      ignorePatterns: ['node_modules/**'],
      addedAt: new Date().toISOString(),
    }
    await set(WS_PREFIX + ws.id, ws)
    workspaces.value.push(ws)
    return ws
  }

  async function removeWorkspace(id: string) {
    await del(WS_PREFIX + id)
    workspaces.value = workspaces.value.filter(w => w.id !== id)
  }

  async function renameWorkspace(id: string, name: string) {
    const ws = workspaces.value.find(w => w.id === id)
    if (!ws) return
    ws.name = name
    await set(WS_PREFIX + id, { ...ws })
  }

  async function updateIgnorePatterns(id: string, patterns: string[]) {
    const ws = workspaces.value.find(w => w.id === id)
    if (!ws) return
    ws.ignorePatterns = patterns
    await set(WS_PREFIX + id, { ...ws })
  }

  async function verifyPermission(ws: Workspace): Promise<boolean> {
    try {
      const perm = await ws.directoryHandle.queryPermission({ mode: 'read' })
      if (perm === 'granted') return true
      const request = await ws.directoryHandle.requestPermission({ mode: 'read' })
      return request === 'granted'
    } catch {
      return false
    }
  }

  return {
    workspaces,
    loading,
    loadWorkspaces,
    addWorkspace,
    removeWorkspace,
    renameWorkspace,
    updateIgnorePatterns,
    verifyPermission,
  }
})
