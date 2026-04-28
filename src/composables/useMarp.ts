import { ref, watch, type Ref } from 'vue'
import { Marp } from '@marp-team/marp-core'

let marp: Marp | null = null

function getMarp(): Marp {
  if (!marp) {
    marp = new Marp({
      html: false,
      math: false,
      script: false,
      inlineSVG: false,
    })
  }
  return marp
}

export function useMarp(
  source: Ref<string>,
  options?: {
    resolveImageUrl?: (relativePath: string) => Promise<string | null>
  }
) {
  const slides = ref<string[]>([])
  const css = ref<string>('')
  const previousUrls = ref<string[]>([])

  async function render() {
    for (const url of previousUrls.value) {
      URL.revokeObjectURL(url)
    }
    previousUrls.value = []

    if (!source.value) {
      slides.value = []
      css.value = ''
      return
    }

    try {
      const result = getMarp().render(source.value, { htmlAsArray: true })
      slides.value = result.html
      css.value = result.css
      await resolveImages()
    } catch (e) {
      console.error('Marp render failed', e)
      slides.value = []
      css.value = ''
    }
  }

  async function resolveImages() {
    if (!options?.resolveImageUrl) return

    const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/g
    const bgRegex = /url\(&#x27;([^&]+)&#x27;\)|url\("([^"]+)"\)|url\('([^']+)'\)/g

    const next: string[] = []
    for (let i = 0; i < slides.value.length; i++) {
      let html = slides.value[i]

      const imgMatches: { original: string; src: string }[] = []
      let m
      while ((m = imgRegex.exec(html)) !== null) {
        const src = m[1]
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:') || src.startsWith('data:')) continue
        imgMatches.push({ original: m[0], src })
      }
      for (const { original, src } of imgMatches) {
        const blobUrl = await options.resolveImageUrl(src)
        if (blobUrl) {
          previousUrls.value.push(blobUrl)
          html = html.replace(original, original.replace(src, blobUrl))
        }
      }

      const bgMatches: { original: string; src: string }[] = []
      let b
      while ((b = bgRegex.exec(html)) !== null) {
        const src = b[1] || b[2] || b[3]
        if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:') || src.startsWith('data:')) continue
        bgMatches.push({ original: b[0], src })
      }
      for (const { original, src } of bgMatches) {
        const blobUrl = await options.resolveImageUrl(src)
        if (blobUrl) {
          previousUrls.value.push(blobUrl)
          html = html.replace(original, original.replace(src, blobUrl))
        }
      }

      next.push(html)
    }
    slides.value = next
  }

  watch(source, render, { immediate: true })

  return { slides, css }
}
