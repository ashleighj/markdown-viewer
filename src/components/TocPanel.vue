<script setup lang="ts">
import { computed } from 'vue'
import { useViewerStore } from '../stores/viewerStore'
import { useUiStore } from '../stores/uiStore'
import { useToc } from '../composables/useToc'

const viewerStore = useViewerStore()
const ui = useUiStore()

// We watch for the content element from the parent via a prop
const props = defineProps<{ contentRef: HTMLElement | null }>()

const contentRefComputed = computed(() => props.contentRef)
const htmlRef = computed(() => viewerStore.renderedHtml)

const { entries, activeId, scrollTo } = useToc(contentRefComputed, htmlRef)

const hasEntries = computed(() => entries.value.length > 0)
</script>

<template>
  <aside
    v-if="ui.tocVisible && hasEntries"
    class="w-52 shrink-0 border-l border-gray-200 bg-white overflow-y-auto thin-scrollbar"
    role="navigation"
    aria-label="Table of contents"
  >
    <div class="p-4">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        On this page
      </h3>
      <ul class="space-y-1">
        <li
          v-for="entry in entries"
          :key="entry.id"
          :style="{ paddingLeft: `${(entry.level - 1) * 12}px` }"
        >
          <button
            @click="scrollTo(entry.id)"
            class="w-full text-left text-sm py-0.5 truncate transition-colors focus-visible:outline-2 focus-visible:outline-blue-500"
            :class="activeId === entry.id
              ? 'text-blue-600 font-medium'
              : 'text-gray-500 hover:text-gray-800'"
          >
            {{ entry.text }}
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>
