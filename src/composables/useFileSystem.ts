export function useFileSystem() {
  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

  function isSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      return await (window as any).showDirectoryPicker({ mode: 'read' })
    } catch {
      return null // user cancelled
    }
  }

  async function resolveFile(
    dirHandle: FileSystemDirectoryHandle,
    relativePath: string
  ): Promise<FileSystemFileHandle | null> {
    const parts = relativePath.split('/').filter(Boolean)
    let current: FileSystemDirectoryHandle = dirHandle
    try {
      for (let i = 0; i < parts.length - 1; i++) {
        current = await current.getDirectoryHandle(parts[i])
      }
      return await current.getFileHandle(parts[parts.length - 1])
    } catch {
      return null
    }
  }

  async function resolveImageUrl(
    dirHandle: FileSystemDirectoryHandle,
    filePath: string,
    imageSrc: string
  ): Promise<string | null> {
    // Resolve relative to the file's directory
    const fileParts = filePath.split('/')
    fileParts.pop()
    const resolvedParts = [...fileParts, ...imageSrc.split('/')].filter(Boolean)

    // Normalize path (handle ..)
    const normalized: string[] = []
    for (const part of resolvedParts) {
      if (part === '..') normalized.pop()
      else if (part !== '.') normalized.push(part)
    }

    const ext = '.' + normalized[normalized.length - 1].split('.').pop()?.toLowerCase()
    if (!IMAGE_EXTENSIONS.includes(ext)) return null

    const handle = await resolveFile(dirHandle, normalized.join('/'))
    if (!handle) return null

    try {
      const file = await handle.getFile()
      if (file.size > MAX_IMAGE_SIZE) return null
      return URL.createObjectURL(file)
    } catch {
      return null
    }
  }

  return { isSupported, pickDirectory, resolveFile, resolveImageUrl }
}
