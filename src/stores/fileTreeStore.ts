import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { FileNode } from '../types'

interface WorkspaceTree {
  nodes: FileNode[]
  scanning: boolean
  error: string | null
  lastScanned: number | null
}

export const useFileTreeStore = defineStore('fileTree', () => {
  const trees = reactive<Record<string, WorkspaceTree>>({})
  const expandedPaths = reactive<Record<string, Set<string>>>({})
  const pollTimers = ref<Record<string, number>>({})

  function getTree(workspaceId: string): WorkspaceTree {
    if (!trees[workspaceId]) {
      trees[workspaceId] = { nodes: [], scanning: false, error: null, lastScanned: null }
    }
    return trees[workspaceId]
  }

  function getExpanded(workspaceId: string): Set<string> {
    if (!expandedPaths[workspaceId]) {
      expandedPaths[workspaceId] = new Set()
    }
    return expandedPaths[workspaceId]
  }

  function toggleExpanded(workspaceId: string, path: string) {
    const set = getExpanded(workspaceId)
    if (set.has(path)) {
      set.delete(path)
    } else {
      set.add(path)
    }
  }

  async function scanDirectory(workspaceId: string, handle: FileSystemDirectoryHandle) {
    const tree = getTree(workspaceId)
    tree.scanning = true
    tree.error = null
    try {
      const nodes = await scanRecursive(handle, '')
      sortNodes(nodes)
      tree.nodes = nodes
      tree.lastScanned = Date.now()
    } catch (e: any) {
      tree.error = e.message || 'Failed to scan directory'
    } finally {
      tree.scanning = false
    }
  }

  async function scanRecursive(
    dirHandle: FileSystemDirectoryHandle,
    basePath: string
  ): Promise<FileNode[]> {
    const nodes: FileNode[] = []
    for await (const entry of dirHandle.values()) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name
      if (entry.kind === 'file') {
        if (entry.name.endsWith('.md')) {
          nodes.push({
            name: entry.name,
            path: entryPath,
            type: 'file',
            handle: entry as FileSystemFileHandle,
          })
        }
      } else if (entry.kind === 'directory') {
        const children = await scanRecursive(
          entry as FileSystemDirectoryHandle,
          entryPath
        )
        if (children.length > 0) {
          nodes.push({
            name: entry.name,
            path: entryPath,
            type: 'directory',
            children,
          })
        }
      }
    }
    return nodes
  }

  function sortNodes(nodes: FileNode[]) {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
    for (const node of nodes) {
      if (node.children) sortNodes(node.children)
    }
  }

  function countFiles(nodes: FileNode[]): number {
    let count = 0
    for (const node of nodes) {
      if (node.type === 'file') count++
      if (node.children) count += countFiles(node.children)
    }
    return count
  }

  function startPolling(workspaceId: string, handle: FileSystemDirectoryHandle) {
    stopPolling(workspaceId)
    const timer = window.setInterval(() => {
      scanDirectory(workspaceId, handle)
    }, 10000)
    pollTimers.value[workspaceId] = timer
  }

  function stopPolling(workspaceId: string) {
    if (pollTimers.value[workspaceId]) {
      clearInterval(pollTimers.value[workspaceId])
      delete pollTimers.value[workspaceId]
    }
  }

  function removeTree(workspaceId: string) {
    stopPolling(workspaceId)
    delete trees[workspaceId]
    delete expandedPaths[workspaceId]
  }

  function findNode(nodes: FileNode[], path: string): FileNode | null {
    for (const node of nodes) {
      if (node.path === path) return node
      if (node.children) {
        const found = findNode(node.children, path)
        if (found) return found
      }
    }
    return null
  }

  function flattenFiles(nodes: FileNode[]): FileNode[] {
    const result: FileNode[] = []
    for (const node of nodes) {
      if (node.type === 'file') result.push(node)
      if (node.children) result.push(...flattenFiles(node.children))
    }
    return result
  }

  return {
    trees,
    getTree,
    getExpanded,
    toggleExpanded,
    scanDirectory,
    countFiles,
    startPolling,
    stopPolling,
    removeTree,
    findNode,
    flattenFiles,
  }
})
