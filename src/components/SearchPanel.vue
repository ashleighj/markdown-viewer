<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '../stores/searchStore'
import { useViewerStore } from '../stores/viewerStore'

const router = useRouter()
const searchStore = useSearchStore()
const viewerStore = useViewerStore()
const input = ref('')
const selectedIndex = ref(-1)

function onInput() {
  searchStore.search(input.value)
  selectedIndex.value = -1
}

function clear() {
  input.value = ''
  searchStore.clear()
  selectedIndex.value = -1
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    clear()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < searchStore.results.length - 1) {
      selectedIndex.value++
    }
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  }
  if (e.key === 'Enter' && selectedIndex.value >= 0) {
    const result = searchStore.results[selectedIndex.value]
    if (result) openResult(result.workspaceId, result.filePath)
  }
}

function openResult(workspaceId: string, filePath: string) {
  viewerStore.activeWorkspaceId = workspaceId
  router.push(`/ws/${workspaceId}/${encodeURIComponent(filePath)}`)
  clear()
}

function highlightMatch(text: string, query: string): string {
  if (!query) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const escapedQuery = escapeHtml(query)
  const regex = new RegExp(`(${escapeRegex(escapedQuery)})`, 'gi')
  return escaped.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<template>
  <div class="relative">
    <input
      v-model="input"
      @input="onInput"
      @keydown="onKeydown"
      data-search-input
      type="text"
      placeholder="Search files..."
      class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
    >
    <button
      v-if="input"
      @click="clear"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
    >
      ✕
    </button>
  </div>

  <!-- Search results overlay in sidebar -->
  <div v-if="searchStore.active" class="mt-2">
    <div v-if="searchStore.searching" class="text-xs text-gray-400 px-1">Searching...</div>
    <div v-else-if="searchStore.results.length === 0" class="text-xs text-gray-400 px-1">
      No results found. Check your ignore rules or try different terms.
    </div>
    <div v-else class="space-y-1 max-h-80 overflow-y-auto thin-scrollbar">
      <div
        v-for="(result, idx) in searchStore.results"
        :key="`${result.workspaceId}:${result.filePath}`"
        class="rounded px-2 py-1.5 cursor-pointer text-xs"
        :class="idx === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'"
        @click="openResult(result.workspaceId, result.filePath)"
      >
        <div class="font-medium text-gray-700 truncate">{{ result.filePath }}</div>
        <div class="text-gray-500 text-[11px]">{{ result.workspaceName }}</div>
        <div
          v-for="(match, mi) in result.matches"
          :key="mi"
          class="text-gray-500 truncate mt-0.5"
          v-html="highlightMatch(match.text.trim(), searchStore.query)"
        />
      </div>
    </div>
    <div class="text-xs text-gray-400 px-1 mt-1" aria-live="polite">
      {{ searchStore.results.length }} result{{ searchStore.results.length === 1 ? '' : 's' }}
    </div>
  </div>
</template>
