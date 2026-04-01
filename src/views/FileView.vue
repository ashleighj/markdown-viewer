<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useFileTreeStore } from '../stores/fileTreeStore'
import { useViewerStore } from '../stores/viewerStore'
import BreadcrumbBar from '../components/BreadcrumbBar.vue'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'
import TocPanel from '../components/TocPanel.vue'

const route = useRoute()
const fileTreeStore = useFileTreeStore()
const viewerStore = useViewerStore()
const markdownRenderer = ref<InstanceType<typeof MarkdownRenderer> | null>(null)

const workspaceId = computed(() => route.params.workspaceId as string)
const filePath = computed(() => {
  const raw = route.params.path
  if (Array.isArray(raw)) return decodeURIComponent(raw.join('/'))
  return decodeURIComponent(raw || '')
})

const contentRef = computed(() => markdownRenderer.value?.contentEl ?? null)

watch(
  [workspaceId, filePath],
  async ([wsId, fp]) => {
    if (!wsId || !fp) return
    viewerStore.activeWorkspaceId = wsId

    const tree = fileTreeStore.getTree(wsId)
    const node = fileTreeStore.findNode(tree.nodes, fp)
    if (node?.handle) {
      await viewerStore.openFile(node.handle, fp)
    } else {
      viewerStore.error = 'File not found. It may have been moved or deleted.'
    }
  },
  { immediate: true }
)

async function forceOpen() {
  const tree = fileTreeStore.getTree(workspaceId.value)
  const node = fileTreeStore.findNode(tree.nodes, filePath.value)
  if (node?.handle) {
    await viewerStore.forceOpenLargeFile(node.handle, filePath.value)
  }
}
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <BreadcrumbBar />

      <div class="flex-1 overflow-y-auto p-6">
        <!-- Loading -->
        <div v-if="viewerStore.loading" class="flex items-center justify-center h-full">
          <div class="text-gray-400 animate-pulse">Loading...</div>
        </div>

        <!-- Error -->
        <div v-else-if="viewerStore.error" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-3xl mb-2">⚠️</div>
            <p class="text-sm text-gray-500">{{ viewerStore.error }}</p>
          </div>
        </div>

        <!-- Large file warning -->
        <div v-else-if="viewerStore.showLargeFileWarning" class="flex items-center justify-center h-full">
          <div class="text-center max-w-sm">
            <div class="text-3xl mb-2">📦</div>
            <p class="text-sm text-gray-600 mb-2">
              This file is {{ (viewerStore.fileSize / 1024).toFixed(0) }} KB, which may be slow to render.
            </p>
            <button
              @click="forceOpen"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Render anyway
            </button>
          </div>
        </div>

        <!-- Content -->
        <MarkdownRenderer v-else ref="markdownRenderer" />
      </div>
    </div>

    <!-- TOC -->
    <TocPanel :content-ref="contentRef" />
  </div>
</template>
