<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useFileTreeStore } from '../stores/fileTreeStore'
import { useSearchStore } from '../stores/searchStore'
import type { Workspace } from '../types'
import FileTreeNode from './FileTreeNode.vue'

const props = defineProps<{ workspace: Workspace }>()

const workspaceStore = useWorkspaceStore()
const fileTreeStore = useFileTreeStore()
const searchStore = useSearchStore()
const expanded = ref(true)
const connected = ref(true)
const editing = ref(false)
const editName = ref('')
const showContextMenu = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })

const tree = computed(() => fileTreeStore.getTree(props.workspace.id))
const fileCount = computed(() => fileTreeStore.countFiles(tree.value.nodes))

onMounted(async () => {
  const ok = await workspaceStore.verifyPermission(props.workspace)
  connected.value = ok
  if (ok) {
    await fileTreeStore.scanDirectory(props.workspace.id, props.workspace.directoryHandle)
    fileTreeStore.startPolling(props.workspace.id, props.workspace.directoryHandle)
  }
})

async function reconnect() {
  const ok = await workspaceStore.verifyPermission(props.workspace)
  connected.value = ok
  if (ok) {
    await fileTreeStore.scanDirectory(props.workspace.id, props.workspace.directoryHandle)
    fileTreeStore.startPolling(props.workspace.id, props.workspace.directoryHandle)
    await searchStore.buildIndex()
  }
}

function startRename() {
  editName.value = props.workspace.name
  editing.value = true
  showContextMenu.value = false
}

async function finishRename() {
  if (editName.value.trim()) {
    await workspaceStore.renameWorkspace(props.workspace.id, editName.value.trim())
  }
  editing.value = false
}

async function remove() {
  fileTreeStore.removeTree(props.workspace.id)
  await workspaceStore.removeWorkspace(props.workspace.id)
  showContextMenu.value = false
}

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  showContextMenu.value = true
}

function closeContextMenu() {
  showContextMenu.value = false
}
</script>

<template>
  <div class="select-none" @click.self="closeContextMenu">
    <!-- Workspace header -->
    <div
      class="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
      @click="expanded = !expanded"
      @contextmenu="onContextMenu"
    >
      <span class="text-xs text-gray-400 w-4 text-center">{{ expanded ? '▼' : '▶' }}</span>

      <template v-if="editing">
        <input
          v-model="editName"
          @keyup.enter="finishRename"
          @blur="finishRename"
          @click.stop
          class="flex-1 px-1 py-0 text-sm border border-blue-400 rounded outline-none"
          ref="renameInput"
          autofocus
        >
      </template>
      <template v-else>
        <span class="flex-1 truncate">{{ workspace.name }}</span>
      </template>

      <span v-if="connected && !tree.scanning" class="text-xs text-gray-400">{{ fileCount }}</span>
      <span v-if="tree.scanning" class="text-xs text-gray-400 animate-pulse">...</span>
      <span v-if="!connected" class="text-xs text-red-400">disconnected</span>
    </div>

    <!-- Disconnected state -->
    <div v-if="!connected" class="px-6 py-2">
      <button
        @click="reconnect"
        class="text-xs text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        Reconnect
      </button>
    </div>

    <!-- File tree -->
    <div v-if="expanded && connected" class="pb-1">
      <div v-if="tree.error" class="px-6 py-1 text-xs text-red-500">{{ tree.error }}</div>
      <div v-else-if="tree.nodes.length === 0 && !tree.scanning" class="px-6 py-2 text-xs text-gray-400">
        No markdown files found
      </div>
      <FileTreeNode
        v-for="node in tree.nodes"
        :key="node.path"
        :node="node"
        :workspace-id="workspace.id"
        :depth="1"
        :ignore-patterns="workspace.ignorePatterns"
      />
    </div>

    <!-- Context menu -->
    <Teleport to="body">
      <div
        v-if="showContextMenu"
        class="fixed inset-0 z-50"
        @click="closeContextMenu"
        @contextmenu.prevent="closeContextMenu"
      >
        <div
          class="absolute bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50"
          :style="{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }"
          role="menu"
        >
          <button
            @click="startRename"
            class="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100"
            role="menuitem"
          >
            Rename
          </button>
          <button
            @click="remove"
            class="w-full px-3 py-1.5 text-sm text-left text-red-600 hover:bg-gray-100"
            role="menuitem"
          >
            Remove
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
