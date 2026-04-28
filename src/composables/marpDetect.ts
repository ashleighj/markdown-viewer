export function isMarpDocument(source: string): boolean {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return false
  return /^\s*marp\s*:\s*true\s*$/m.test(m[1])
}
