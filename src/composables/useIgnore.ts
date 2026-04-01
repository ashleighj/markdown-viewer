import picomatch from 'picomatch'
import { computed, type Ref, isRef } from 'vue'

export function useIgnore(patterns: Ref<string[]> | string[]) {
  const matcher = computed(() => {
    const p = isRef(patterns) ? patterns.value : patterns
    if (p.length === 0) return () => false
    return picomatch(p)
  })

  function isIgnored(path: string): boolean {
    return matcher.value(path)
  }

  return { isIgnored }
}
