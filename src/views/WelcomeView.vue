<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useFileTreeStore } from '../stores/fileTreeStore'
import { useSearchStore } from '../stores/searchStore'
import { useFileSystem } from '../composables/useFileSystem'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const fileTreeStore = useFileTreeStore()
const searchStore = useSearchStore()
const { pickDirectory, isSupported } = useFileSystem()

async function addFolder() {
  const handle = await pickDirectory()
  if (!handle) return
  const ws = await workspaceStore.addWorkspace(handle)
  await fileTreeStore.scanDirectory(ws.id, handle)
  fileTreeStore.startPolling(ws.id, handle)
  await searchStore.buildIndex()
  router.push(`/ws/${ws.id}`)
}
</script>

<template>
  <div class="flex-1 flex items-center justify-center">
    <div class="text-center max-w-md px-6">
      <div class="text-5xl mb-4">📖</div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Markdown Viewer</h1>
      <p class="text-gray-500 mb-6">
        Browse and read markdown files from your local folders.
        Add a folder to get started.
      </p>

      <div v-if="!isSupported()" class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p class="text-sm text-amber-800">
          This app requires the File System Access API, which is only available in
          <strong>Chromium-based browsers</strong> (Chrome, Edge, Arc, Brave).
        </p>
      </div>

      <button
        v-if="isSupported()"
        @click="addFolder"
        class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 transition-colors"
      >
        <span class="text-xl">+</span>
        Add Folder
      </button>

      <div class="mt-8 text-left text-sm text-gray-400 space-y-2">
        <div class="flex items-start gap-2">
          <span class="shrink-0">--</span>
          <span>Syntax-highlighted code blocks</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="shrink-0">--</span>
          <span>Auto-generated table of contents</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="shrink-0">--</span>
          <span>Full-text search across all files</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="shrink-0">--</span>
          <span>Ignore files with glob patterns</span>
        </div>
      </div>

      <p class="mt-6 text-xs text-gray-300">
        Press <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-500">?</kbd> for keyboard shortcuts
      </p>
    </div>
  </div>
</template>
