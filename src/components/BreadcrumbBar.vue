<script setup lang="ts">
import { computed } from 'vue'
import { useViewerStore } from '../stores/viewerStore'
import { useWorkspaceStore } from '../stores/workspaceStore'

const viewerStore = useViewerStore()
const workspaceStore = useWorkspaceStore()

const workspace = computed(() => {
  const id = viewerStore.activeWorkspaceId
  return id ? workspaceStore.workspaces.find(w => w.id === id) : null
})

const segments = computed(() => {
  if (!workspace.value || !viewerStore.activeFilePath) return []
  const parts = viewerStore.activeFilePath.split('/')
  return [workspace.value.name, ...parts]
})
</script>

<template>
  <nav v-if="segments.length > 0" class="px-6 py-2 text-sm text-gray-500 border-b border-gray-200 bg-white">
    <ol class="flex items-center gap-1 flex-wrap">
      <li v-for="(seg, i) in segments" :key="i" class="flex items-center gap-1">
        <span v-if="i > 0" class="text-gray-300">/</span>
        <span :class="i === segments.length - 1 ? 'text-gray-800 font-medium' : ''">{{ seg }}</span>
      </li>
    </ol>
  </nav>
</template>
