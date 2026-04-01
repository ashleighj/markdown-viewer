<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useViewerStore } from '../stores/viewerStore'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const viewerStore = useViewerStore()

const workspaceId = computed(() => route.params.workspaceId as string)
const workspace = computed(() => workspaceStore.workspaces.find(w => w.id === workspaceId.value))

// Set active workspace
viewerStore.activeWorkspaceId = workspaceId.value
viewerStore.clearContent()
</script>

<template>
  <div class="flex-1 flex items-center justify-center">
    <div class="text-center text-gray-400">
      <div class="text-4xl mb-3">📂</div>
      <p v-if="workspace" class="text-sm">
        Select a file from <strong class="text-gray-600">{{ workspace.name }}</strong> to start reading.
      </p>
      <p v-else class="text-sm">Workspace not found.</p>
    </div>
  </div>
</template>
