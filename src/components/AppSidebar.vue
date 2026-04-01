<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useFileTreeStore } from '../stores/fileTreeStore'
import { useSearchStore } from '../stores/searchStore'
import { useUiStore } from '../stores/uiStore'
import { useFileSystem } from '../composables/useFileSystem'
import WorkspaceItem from './WorkspaceItem.vue'
import SearchPanel from './SearchPanel.vue'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const fileTreeStore = useFileTreeStore()
const searchStore = useSearchStore()
const ui = useUiStore()
const { pickDirectory } = useFileSystem()

const sidebarStyle = computed(() => ({
  width: `${ui.sidebarWidth}px`,
  minWidth: `${ui.sidebarWidth}px`,
}))

async function addWorkspace() {
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
  <aside
    v-if="ui.sidebarVisible"
    class="flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden"
    :style="sidebarStyle"
  >
    <!-- Search -->
    <div class="p-3 border-b border-gray-200">
      <SearchPanel />
    </div>

    <!-- Workspaces -->
    <div class="flex-1 overflow-y-auto thin-scrollbar" data-file-tree tabindex="0">
      <div v-if="workspaceStore.workspaces.length === 0" class="p-4 text-sm text-gray-400 text-center">
        No workspaces yet
      </div>
      <WorkspaceItem
        v-for="ws in workspaceStore.workspaces"
        :key="ws.id"
        :workspace="ws"
      />
    </div>

    <!-- Footer -->
    <div class="p-3 border-t border-gray-200 space-y-2">
      <button
        @click="addWorkspace"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        <span class="text-lg leading-none">+</span>
        Add Folder
      </button>
      <label class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
        <input
          type="checkbox"
          :checked="ui.showIgnoredFiles"
          @change="ui.toggleIgnoredFiles()"
          class="rounded"
        >
        Show ignored files
      </label>
    </div>
  </aside>
</template>
