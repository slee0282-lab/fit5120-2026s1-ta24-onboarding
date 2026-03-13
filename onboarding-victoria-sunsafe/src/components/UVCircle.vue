<script setup lang="ts">
const props = defineProps<{
  uvIndex: number | null
}>()

interface UVCategory {
  label: string
  color: string
  textColor: string
}

function getCategory(uv: number): UVCategory {
  if (uv <= 2) return { label: 'Low', color: '#4caf50', textColor: '#fff' }
  if (uv <= 5) return { label: 'Moderate', color: '#ffeb3b', textColor: '#333' }
  if (uv <= 7) return { label: 'High', color: '#ff9800', textColor: '#fff' }
  if (uv <= 10) return { label: 'Very High', color: '#f44336', textColor: '#fff' }
  return { label: 'Extreme', color: '#9c27b0', textColor: '#fff' }
}

import { computed } from 'vue'

const category = computed(() =>
  props.uvIndex !== null ? getCategory(props.uvIndex) : null
)
</script>

<template>
  <div class="d-flex flex-column align-items-center">
    <div
      class="uv-circle d-flex flex-column align-items-center justify-content-center rounded-circle"
      :style="category ? { backgroundColor: category.color, color: category.textColor } : {}"
    >
      <span v-if="uvIndex !== null" class="uv-value fw-bold">{{ uvIndex }}</span>
      <span v-else class="uv-value text-muted">--</span>
      <span v-if="category" class="uv-label">{{ category.label }}</span>
    </div>
    <p v-if="uvIndex === null" class="text-muted mt-2 small">Enter a location to see UV data</p>
  </div>
</template>

<style scoped>
.uv-circle {
  width: 160px;
  height: 160px;
  background-color: #e0e0e0;
  border: 4px solid rgba(0, 0, 0, 0.1);
  transition: background-color 0.4s;
}

.uv-value {
  font-size: 2.5rem;
  line-height: 1;
}

.uv-label {
  font-size: 0.85rem;
  margin-top: 4px;
}
</style>
