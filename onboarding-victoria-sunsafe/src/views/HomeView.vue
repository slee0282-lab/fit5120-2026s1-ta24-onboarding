<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import LocationInput from '../components/LocationInput.vue'
import UVCircle from '../components/UVCircle.vue'
import AlertBanner from '../components/AlertBanner.vue'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

const uvIndex = ref<number | null>(null)
const locationName = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const loading = ref(false)
const lastQuery = ref<string | null>(null)

let refreshTimer: ReturnType<typeof setInterval> | null = null

async function fetchUV(query: string) {
  loading.value = true
  errorMessage.value = null

  try {
    const params = new URLSearchParams({ q: query })
    const res = await fetch(`${API_BASE}/api/uv?${params}`)
    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.error ?? 'Something went wrong. Please try again.'
      uvIndex.value = null
      locationName.value = null
      return
    }

    uvIndex.value = data.uv_index
    locationName.value = data.location
  } catch {
    errorMessage.value = 'UV data is currently unavailable. Please try again later.'
    uvIndex.value = null
    locationName.value = null
  } finally {
    loading.value = false
  }
}

function handleSearch(query: string) {
  lastQuery.value = query

  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
  }

  fetchUV(query)

  refreshTimer = setInterval(() => {
    if (lastQuery.value) fetchUV(lastQuery.value)
  }, 60 * 60 * 1000)
}

onUnmounted(() => {
  if (refreshTimer !== null) clearInterval(refreshTimer)
})
</script>

<template>
  <main class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <h1 class="mb-1">UV Index</h1>
        <p class="text-muted mb-4">
          Check the current UV level for any Victorian suburb or postcode.
        </p>

        <LocationInput @search="handleSearch" />

        <div v-if="loading" class="text-center my-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else class="mt-4">
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <template v-else-if="uvIndex !== null">
            <p v-if="locationName" class="text-center text-muted mb-3">
              {{ locationName }}
            </p>

            <div class="d-flex justify-content-center mb-4">
              <UVCircle :uv-index="uvIndex" />
            </div>

            <AlertBanner :uv-index="uvIndex" />

            <div class="mt-3">
              <h6 class="text-muted">UV Categories</h6>
              <div class="d-flex gap-2 flex-wrap">
                <span class="badge" style="background-color: #4caf50">Low (0–2)</span>
                <span class="badge" style="background-color: #ffeb3b; color: #333">Moderate (3–5)</span>
                <span class="badge" style="background-color: #ff9800">High (6–7)</span>
                <span class="badge" style="background-color: #f44336">Very High (8–10)</span>
                <span class="badge" style="background-color: #9c27b0">Extreme (11+)</span>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="d-flex justify-content-center mb-4">
              <UVCircle :uv-index="null" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>
