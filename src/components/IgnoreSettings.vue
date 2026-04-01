<script setup lang="ts">
import { ref } from 'vue'
import { useWorkspaceStore } from '../stores/workspaceStore'
import type { Workspace } from '../types'

const props = defineProps<{ workspace: Workspace }>()
const emit = defineEmits<{ close: [] }>()
const workspaceStore = useWorkspaceStore()

const patterns = ref([...props.workspace.ignorePatterns])
const newPattern = ref('')

function add() {
  const p = newPattern.value.trim()
  if (p && !patterns.value.includes(p)) {
    patterns.value.push(p)
    newPattern.value = ''
  }
}

function remove(index: number) {
  patterns.value.splice(index, 1)
}

async function save() {
  await workspaceStore.updateIgnorePatterns(props.workspace.id, [...patterns.value])
  emit('close')
}
</script>

<template>
  <div class="p-4 space-y-3">
    <h3 class="text-sm font-semibold text-gray-700">
      Ignore patterns for {{ workspace.name }}
    </h3>

    <div class="space-y-1">
      <div
        v-for="(pattern, idx) in patterns"
        :key="idx"
        class="flex items-center gap-2 text-sm"
      >
        <code class="flex-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono">{{ pattern }}</code>
        <button
          @click="remove(idx)"
          class="text-red-400 hover:text-red-600 text-xs"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="flex gap-2">
      <input
        v-model="newPattern"
        @keyup.enter="add"
        placeholder="e.g. **/draft-*"
        class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
      >
      <button
        @click="add"
        class="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
      >
        Add
      </button>
    </div>

    <div class="flex gap-2 justify-end pt-2">
      <button
        @click="$emit('close')"
        class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
      >
        Cancel
      </button>
      <button
        @click="save"
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  </div>
</template>
