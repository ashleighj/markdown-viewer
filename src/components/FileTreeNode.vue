<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFileTreeStore } from '../stores/fileTreeStore'
import { useViewerStore } from '../stores/viewerStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useUiStore } from '../stores/uiStore'
import { useIgnore } from '../composables/useIgnore'
import type { FileNode } from '../types'

const props = defineProps<{
  node: FileNode
  workspaceId: string
  depth: number
  ignorePatterns: string[]
}>()

const router = useRouter()
const fileTreeStore = useFileTreeStore()
const viewerStore = useViewerStore()
const workspaceStore = useWorkspaceStore()
const ui = useUiStore()

const { isIgnored } = useIgnore(computed(() => props.ignorePatterns))
const ignored = computed(() => isIgnored(props.node.path))
const expanded = computed(() => fileTreeStore.getExpanded(props.workspaceId).has(props.node.path))
const isActive = computed(() =>
  viewerStore.activeWorkspaceId === props.workspaceId &&
  viewerStore.activeFilePath === props.node.path
)
const showContextMenu = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })

const visible = computed(() => {
  if (!ignored.value) return true
  return ui.showIgnoredFiles
})

const childCount = computed(() => {
  if (props.node.type !== 'directory' || !props.node.children) return 0
  return fileTreeStore.countFiles(props.node.children)
})

function toggle() {
  if (props.node.type === 'directory') {
    fileTreeStore.toggleExpanded(props.workspaceId, props.node.path)
  }
}

async function openFile() {
  if (props.node.type !== 'file' || !props.node.handle) return
  viewerStore.activeWorkspaceId = props.workspaceId
  await viewerStore.openFile(props.node.handle, props.node.path)
  router.push(`/ws/${props.workspaceId}/${encodeURIComponent(props.node.path)}`)
}

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  showContextMenu.value = true
}

function closeContextMenu() {
  showContextMenu.value = false
}

async function ignoreItem() {
  const ws = workspaceStore.workspaces.find(w => w.id === props.workspaceId)
  if (!ws) return
  const pattern = props.node.type === 'directory'
    ? `${props.node.path}/**`
    : props.node.path
  if (!ws.ignorePatterns.includes(pattern)) {
    await workspaceStore.updateIgnorePatterns(ws.id, [...ws.ignorePatterns, pattern])
  }
  showContextMenu.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    if (props.node.type === 'file') openFile()
    else toggle()
  } else if (e.key === 'ArrowRight' && props.node.type === 'directory' && !expanded.value) {
    toggle()
  } else if (e.key === 'ArrowLeft' && props.node.type === 'directory' && expanded.value) {
    toggle()
  }
}
</script>

<template>
  <div v-if="visible">
    <div
      class="flex items-center gap-1 py-0.5 pr-3 cursor-pointer text-sm hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]"
      :class="{
        'bg-blue-50 text-blue-700': isActive,
        'text-gray-700': !isActive && !ignored,
        'text-gray-400 opacity-60': ignored,
      }"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="node.type === 'file' ? openFile() : toggle()"
      @contextmenu="onContextMenu"
      @keydown="handleKeydown"
      tabindex="0"
      role="treeitem"
      :aria-expanded="node.type === 'directory' ? expanded : undefined"
      :aria-selected="isActive"
    >
      <!-- Icon -->
      <span class="w-4 text-center text-xs text-gray-400 shrink-0">
        <template v-if="node.type === 'directory'">{{ expanded ? '▼' : '▶' }}</template>
        <template v-else>📄</template>
      </span>

      <!-- Name -->
      <span class="flex-1 truncate">{{ node.name }}</span>

      <!-- File count badge for directories -->
      <span v-if="node.type === 'directory'" class="text-xs text-gray-400 shrink-0">
        {{ childCount }}
      </span>
    </div>

    <!-- Children -->
    <div v-if="node.type === 'directory' && expanded && node.children" role="group">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :workspace-id="workspaceId"
        :depth="depth + 1"
        :ignore-patterns="ignorePatterns"
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
            @click="ignoreItem"
            class="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100"
            role="menuitem"
          >
            Ignore
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
