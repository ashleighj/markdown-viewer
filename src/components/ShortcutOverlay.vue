<script setup lang="ts">
import { useUiStore } from '../stores/uiStore'

const ui = useUiStore()

const shortcuts = [
  { keys: '⌘ B', desc: 'Toggle sidebar' },
  { keys: '⌘ \\', desc: 'Toggle table of contents' },
  { keys: '⌘ F', desc: 'Focus search' },
  { keys: '⌘ ⇧ E', desc: 'Focus file tree' },
  { keys: '↑ / ↓', desc: 'Navigate tree or search' },
  { keys: 'Enter', desc: 'Open selected file' },
  { keys: '← / →', desc: 'Collapse / expand folder' },
  { keys: 'Esc', desc: 'Close panels / clear search' },
  { keys: '?', desc: 'Show this overlay' },
]
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ui.showShortcutOverlay"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="ui.showShortcutOverlay = false"
      @keydown.escape="ui.showShortcutOverlay = false"
    >
      <div class="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Keyboard Shortcuts</h2>
        <dl class="space-y-2">
          <div
            v-for="s in shortcuts"
            :key="s.keys"
            class="flex items-center justify-between"
          >
            <dt class="text-sm text-gray-600">{{ s.desc }}</dt>
            <dd>
              <kbd class="px-2 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                {{ s.keys }}
              </kbd>
            </dd>
          </div>
        </dl>
        <button
          @click="ui.showShortcutOverlay = false"
          class="mt-4 w-full py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  </Teleport>
</template>
