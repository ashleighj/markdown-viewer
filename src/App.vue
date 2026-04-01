<script setup lang="ts">
import { onMounted } from 'vue'
import { useWorkspaceStore } from './stores/workspaceStore'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useFileSystem } from './composables/useFileSystem'
import AppSidebar from './components/AppSidebar.vue'
import ShortcutOverlay from './components/ShortcutOverlay.vue'

const workspaceStore = useWorkspaceStore()
const { isSupported } = useFileSystem()

useKeyboardShortcuts()

onMounted(async () => {
  await workspaceStore.loadWorkspaces()
})
</script>

<template>
  <div class="h-full flex bg-white">
    <!-- Unsupported browser banner -->
    <div
      v-if="!isSupported()"
      class="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800"
    >
      This app requires a Chromium-based browser (Chrome, Edge, Arc, Brave) for filesystem access.
    </div>

    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main content area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <router-view />
    </main>

    <!-- Shortcut overlay -->
    <ShortcutOverlay />
  </div>
</template>
