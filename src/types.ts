export interface Workspace {
  id: string
  name: string
  directoryHandle: FileSystemDirectoryHandle
  ignorePatterns: string[]
  addedAt: string
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  handle?: FileSystemFileHandle
}

export interface TocEntry {
  id: string
  text: string
  level: number
}

export interface SearchResult {
  workspaceId: string
  workspaceName: string
  filePath: string
  matches: SearchMatch[]
}

export interface SearchMatch {
  line: number
  text: string
  offset: number
}

export interface SearchIndexEntry {
  workspaceId: string
  filePath: string
  content: string
  lowerContent: string
}
