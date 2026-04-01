<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useViewerStore } from '../stores/viewerStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useMarkdown } from '../composables/useMarkdown'
import { useFileSystem } from '../composables/useFileSystem'

const router = useRouter()
const viewerStore = useViewerStore()
const workspaceStore = useWorkspaceStore()
const { resolveImageUrl: resolveImage } = useFileSystem()
const contentEl = ref<HTMLElement | null>(null)

const workspace = computed(() => {
  const id = viewerStore.activeWorkspaceId
  return id ? workspaceStore.workspaces.find(w => w.id === id) : null
})

const { html } = useMarkdown(
  computed(() => viewerStore.content),
  {
    async resolveImageUrl(src: string) {
      if (!workspace.value || !viewerStore.activeFilePath) return null
      return resolveImage(
        workspace.value.directoryHandle,
        viewerStore.activeFilePath,
        src
      )
    },
  }
)

// Sync rendered HTML back to store for TOC
watch(html, (v) => {
  viewerStore.renderedHtml = v
})

// Handle clicks on relative .md links
function onClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('a')
  if (!target) return
  const href = target.getAttribute('href')
  if (!href || href.startsWith('http://') || href.startsWith('https://')) return

  e.preventDefault()
  if (href.endsWith('.md') && viewerStore.activeWorkspaceId) {
    // Resolve relative path
    const currentDir = viewerStore.activeFilePath?.split('/').slice(0, -1).join('/') || ''
    const parts = [...currentDir.split('/').filter(Boolean), ...href.split('/').filter(Boolean)]
    const normalized: string[] = []
    for (const p of parts) {
      if (p === '..') normalized.pop()
      else if (p !== '.') normalized.push(p)
    }
    const resolvedPath = normalized.join('/')
    router.push(`/ws/${viewerStore.activeWorkspaceId}/${encodeURIComponent(resolvedPath)}`)
  }
}

defineExpose({ contentEl })
</script>

<template>
  <div
    ref="contentEl"
    class="markdown-body max-w-prose mx-auto"
    v-html="html"
    @click="onClick"
  />
</template>
