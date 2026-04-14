import { ref, watch, type Ref } from 'vue'
import MarkdownIt from 'markdown-it'
import { createHighlighter, type Highlighter } from 'shiki'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'default' })

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
})

// GFM: tables are built in with markdown-it. Enable strikethrough.
md.enable('strikethrough')
// Task lists plugin (inline)
md.inline.ruler.after('emphasis', 'tasklist', (state, silent) => {
  const pos = state.pos
  const max = state.posMax
  if (pos + 3 > max) return false
  const slice = state.src.slice(pos, pos + 3)
  if (slice === '[ ]' || slice === '[x]' || slice === '[X]') {
    if (silent) return true
    const checked = slice !== '[ ]'
    const token = state.push('tasklist_checkbox', 'input', 0)
    token.attrSet('type', 'checkbox')
    token.attrSet('disabled', 'true')
    if (checked) token.attrSet('checked', 'true')
    state.pos += 3
    return true
  }
  return false
})
md.renderer.rules.tasklist_checkbox = (tokens, idx) => {
  const checked = tokens[idx].attrGet('checked') ? ' checked' : ''
  return `<input type="checkbox" disabled${checked}>`
}

let highlighter: Highlighter | null = null
let highlighterReady = false

const highlighterPromise = createHighlighter({
  themes: ['github-light'],
  langs: [
    'javascript', 'typescript', 'python', 'bash', 'json', 'html', 'css',
    'yaml', 'markdown', 'rust', 'go', 'java', 'c', 'cpp', 'sql', 'ruby',
    'php', 'swift', 'kotlin', 'shell', 'diff', 'toml', 'xml',
  ],
}).then(h => {
  highlighter = h
  highlighterReady = true
  return h
})

export function useMarkdown(
  source: Ref<string>,
  options?: {
    resolvePath?: (relativePath: string) => string | null
    resolveImageUrl?: (relativePath: string) => Promise<string | null>
  }
) {
  const html = ref('')
  const previousUrls = ref<string[]>([])

  let mermaidId = 0

  async function render() {
    // Revoke previous blob URLs
    for (const url of previousUrls.value) {
      URL.revokeObjectURL(url)
    }
    previousUrls.value = []

    let rendered = md.render(source.value)

    // Add IDs to headings for TOC
    let headingIndex = 0
    rendered = rendered.replace(/<(h[1-6])([^>]*)>(.*?)<\/h[1-6]>/g, (match, tag, attrs, content) => {
      const id = `heading-${headingIndex++}`
      if (attrs.includes('id=')) return match
      return `<${tag} id="${id}"${attrs}>${content}</${tag}>`
    })

    rendered = await renderMermaidBlocks(rendered)

    html.value = rendered
    highlightCodeBlocks()
    resolveImages()
  }

  async function renderMermaidBlocks(input: string): Promise<string> {
    const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g
    let match
    const replacements: [string, string][] = []

    while ((match = mermaidRegex.exec(input)) !== null) {
      const code = match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
      try {
        const { svg } = await mermaid.render(`mermaid-${mermaidId++}`, code.trim())
        replacements.push([match[0], `<div class="mermaid-diagram">${svg}</div>`])
      } catch {
        // If mermaid can't parse it, leave as a code block
      }
    }

    let result = input
    for (const [original, replacement] of replacements) {
      result = result.replace(original, replacement)
    }
    return result
  }

  async function highlightCodeBlocks() {
    if (!highlighterReady) {
      await highlighterPromise
    }
    if (!highlighter) return

    const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g
    let newHtml = html.value
    let match
    const replacements: [string, string][] = []

    while ((match = codeBlockRegex.exec(html.value)) !== null) {
      const lang = match[1]
      const code = match[2]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
      try {
        const highlighted = highlighter.codeToHtml(code, { lang, theme: 'github-light' })
        replacements.push([match[0], highlighted])
      } catch {
        // language not loaded, leave as-is
      }
    }

    for (const [original, replacement] of replacements) {
      newHtml = newHtml.replace(original, replacement)
    }

    if (replacements.length > 0) {
      html.value = newHtml
    }
  }

  async function resolveImages() {
    if (!options?.resolveImageUrl) return

    const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/g
    let match
    const toResolve: { original: string; src: string }[] = []

    while ((match = imgRegex.exec(html.value)) !== null) {
      const src = match[1]
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) continue
      toResolve.push({ original: match[0], src })
    }

    for (const { original, src } of toResolve) {
      const blobUrl = await options.resolveImageUrl(src)
      if (blobUrl) {
        previousUrls.value.push(blobUrl)
        html.value = html.value.replace(original, original.replace(src, blobUrl))
      }
    }
  }

  watch(source, render, { immediate: true })

  return { html }
}
