<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  search: [query: string]
}>()

const query = ref('')

function handleSubmit() {
  const trimmed = query.value.trim()
  if (trimmed) {
    emit('search', trimmed)
  }
}
</script>

<template>
  <form class="d-flex gap-2" @submit.prevent="handleSubmit">
    <input
      v-model="query"
      type="text"
      class="form-control"
      placeholder="Enter suburb or postcode (e.g. 3000 or Melbourne)"
      maxlength="100"
      aria-label="Suburb or postcode"
    />
    <button type="submit" class="btn btn-primary text-nowrap">Check UV</button>
  </form>
</template>
