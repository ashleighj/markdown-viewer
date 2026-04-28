<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useViewerStore } from '../stores/viewerStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useMarp } from '../composables/useMarp'
import { useFileSystem } from '../composables/useFileSystem'

const viewerStore = useViewerStore()
const workspaceStore = useWorkspaceStore()
const { resolveImageUrl: resolveImage } = useFileSystem()

const workspace = computed(() => {
  const id = viewerStore.activeWorkspaceId
  return id ? workspaceStore.workspaces.find(w => w.id === id) : null
})

const { slides, css } = useMarp(
  computed(() => viewerStore.content),
  {
    async resolveImageUrl(src: string) {
      if (!workspace.value || !viewerStore.activeFilePath) return null
      return resolveImage(
        workspace.value.directoryHandle,
        viewerStore.activeFilePath,
        src,
      )
    },
  },
)

const current = ref(0)
const isFullscreen = ref(false)
const deckEl = ref<HTMLElement | null>(null)

watch(
  () => viewerStore.activeFilePath,
  () => {
    current.value = 0
  },
)

watch(slides, (s) => {
  if (current.value >= s.length) current.value = Math.max(0, s.length - 1)
})

const total = computed(() => slides.value.length)

function next() {
  if (current.value < total.value - 1) current.value++
}
function prev() {
  if (current.value > 0) current.value--
}
function goto(i: number) {
  current.value = Math.max(0, Math.min(total.value - 1, i))
}

async function toggleFullscreen() {
  if (!deckEl.value) return
  if (!document.fullscreenElement) {
    await deckEl.value.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function onKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault()
    prev()
  } else if (e.key === 'Home') {
    e.preventDefault()
    goto(0)
  } else if (e.key === 'End') {
    e.preventDefault()
    goto(total.value - 1)
  } else if (e.key === 'f' || e.key === 'F') {
    e.preventDefault()
    toggleFullscreen()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div ref="deckEl" class="marp-deck" :class="{ 'is-fullscreen': isFullscreen }">
    <component :is="'style'">{{ css }}</component>

    <div class="marp-stage">
      <div
        v-if="slides.length > 0"
        class="marpit marp-slide-wrapper"
        v-html="slides[current]"
      />
      <div v-else class="text-gray-400 text-sm">No slides to display</div>
    </div>

    <div class="marp-controls">
      <button
        class="marp-btn"
        :disabled="current === 0"
        @click="prev"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <span class="marp-counter">{{ current + 1 }} / {{ total }}</span>
      <button
        class="marp-btn"
        :disabled="current >= total - 1"
        @click="next"
        aria-label="Next slide"
      >
        ›
      </button>
      <button class="marp-btn" @click="toggleFullscreen" aria-label="Toggle fullscreen">
        {{ isFullscreen ? '⤓' : '⤢' }}
      </button>
    </div>
  </div>
</template>

<style>
.marp-deck {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 1rem;
}
.marp-deck.is-fullscreen {
  background: #000;
  padding: 0;
  justify-content: center;
}

.marp-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
}

.marp-slide-wrapper {
  width: 100%;
  max-width: min(100%, calc((100vh - 8rem) * 16 / 9));
  aspect-ratio: 16 / 9;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.is-fullscreen .marp-slide-wrapper {
  box-shadow: none;
  border-radius: 0;
  max-width: min(100vw, calc(100vh * 16 / 9));
  max-height: min(100vh, calc(100vw * 9 / 16));
}

.marp-slide-wrapper > svg {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
.marp-slide-wrapper > section {
  width: 100% !important;
  height: 100% !important;
}

.marp-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.is-fullscreen .marp-controls {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.85;
}

.marp-btn {
  background: transparent;
  border: none;
  color: #1f2937;
  font-size: 1.25rem;
  line-height: 1;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.marp-btn:hover:not(:disabled) {
  background: #f3f4f6;
}
.marp-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.marp-counter {
  font-variant-numeric: tabular-nums;
  font-size: 0.875rem;
  color: #4b5563;
  min-width: 4rem;
  text-align: center;
}
</style>
