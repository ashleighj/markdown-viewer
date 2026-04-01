import { ref, onMounted, onUnmounted, nextTick, watch, type Ref } from 'vue'
import type { TocEntry } from '../types'

export function useToc(contentRef: Ref<HTMLElement | null>, html: Ref<string>) {
  const entries = ref<TocEntry[]>([])
  const activeId = ref<string | null>(null)
  let observer: IntersectionObserver | null = null

  function extractEntries() {
    if (!contentRef.value) {
      entries.value = []
      return
    }
    const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const result: TocEntry[] = []
    headings.forEach((el, i) => {
      const id = el.id || `heading-${i}`
      if (!el.id) el.id = id
      result.push({
        id,
        text: el.textContent || '',
        level: parseInt(el.tagName[1]),
      })
    })
    entries.value = result
    setupObserver()
  }

  function setupObserver() {
    if (observer) observer.disconnect()
    if (!contentRef.value) return

    const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (headings.length === 0) return

    observer = new IntersectionObserver(
      (intersections) => {
        for (const entry of intersections) {
          if (entry.isIntersecting) {
            activeId.value = entry.target.id
            break
          }
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0.1 }
    )

    headings.forEach((el) => observer!.observe(el))
  }

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      activeId.value = id
    }
  }

  watch(html, () => {
    nextTick(extractEntries)
  })

  onMounted(() => nextTick(extractEntries))
  onUnmounted(() => observer?.disconnect())

  return { entries, activeId, scrollTo }
}
