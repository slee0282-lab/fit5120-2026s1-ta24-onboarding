<script setup lang="ts">
import { ref, computed } from 'vue'
import UVCircle from '../components/UVCircle.vue'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

const uvIndex = ref<number | null>(null)
const locationName = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const loading = ref(false)
const query = ref('')
const selectedSkinType = ref<1 | 2 | 3 | 4>(2)

const skinTypes = [
  { value: 1, label: 'Type I — Always burns, never tans (very fair)' },
  { value: 2, label: 'Type II — Usually burns, sometimes tans (fair)' },
  { value: 3, label: 'Type III — Sometimes burns, usually tans (medium)' },
  { value: 4, label: 'Type IV — Rarely burns, always tans (olive/brown)' },
]

// First-degree burn dose thresholds from Table 4 (kW/m²)^(4/3)·s
const burnDose: Record<number, number> = { 1: 84.9, 2: 115, 3: 143, 4: 195 }

// Factor to convert (kW/m²)^(4/3) to (W/m²)^(4/3): 1000^(4/3)
const KW_TO_W_FACTOR = Math.pow(1000, 4 / 3)

function calcSafeMinutes(uvi: number, skinType: 1 | 2 | 3 | 4): number {
  const iUV = 15.1 * uvi + 35.5                  // W/m² (Eq. 4)
  const iUV43 = Math.pow(iUV, 4 / 3)             // (W/m²)^(4/3)
  const dThreshold = (burnDose[skinType] ?? 115) * KW_TO_W_FACTOR  // (W/m²)^(4/3)·s
  const seconds = dThreshold / iUV43
  return Math.round(seconds / 60)
}

const safeMinutes = computed(() => {
  if (uvIndex.value === null || uvIndex.value === 0) return null
  return calcSafeMinutes(uvIndex.value, selectedSkinType.value)
})

function spfRecommendation(uvi: number): { spf: string; reapply: string; detail: string } {
  if (uvi <= 2) return { spf: 'SPF 15+', reapply: 'Not required for brief exposure', detail: 'Low UV — minimal protection needed for most people.' }
  if (uvi <= 5) return { spf: 'SPF 30+', reapply: 'Every 2 hours outdoors', detail: 'Moderate UV — apply generously 20 minutes before going outside.' }
  if (uvi <= 7) return { spf: 'SPF 50+', reapply: 'Every 2 hours (more often if sweating or swimming)', detail: 'High UV — use sunscreen, hat, sunglasses, and protective clothing.' }
  if (uvi <= 10) return { spf: 'SPF 50+', reapply: 'Every 1–2 hours', detail: 'Very High UV — seek shade between 10am–4pm. Full protection required.' }
  return { spf: 'SPF 50+', reapply: 'Every hour', detail: 'Extreme UV — avoid going outdoors if possible. Stay in shade and cover all exposed skin.' }
}

const spf = computed(() => (uvIndex.value !== null ? spfRecommendation(uvIndex.value) : null))

// Cancer Council Australia: 5 ml (~1 teaspoon) per body part, ~35 ml total for full body
const BODY_PARTS = [
  'Face, head and neck',
  'Each arm',
  'Body front',
  'Body back',
  'Each leg',
]

async function handleSearch() {
  const trimmed = query.value.trim()
  if (!trimmed) return

  loading.value = true
  errorMessage.value = null

  try {
    const params = new URLSearchParams({ q: trimmed })
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
</script>

<template>
  <main class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-7">
        <h1 class="mb-1">Sunscreen Guide</h1>
        <p class="text-muted mb-4">
          Based on your UV level and skin type, find out how long you can safely stay outside
          and how much sunscreen to apply.
        </p>

        <form class="d-flex gap-2 mb-4" @submit.prevent="handleSearch">
          <input
            v-model="query"
            type="text"
            class="form-control"
            placeholder="Enter suburb or postcode"
            maxlength="100"
            aria-label="Suburb or postcode"
          />
          <button type="submit" class="btn btn-primary text-nowrap">Get Guide</button>
        </form>

        <div v-if="loading" class="text-center my-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>

        <template v-else-if="uvIndex !== null">
          <p v-if="locationName" class="text-center text-muted mb-2">{{ locationName }}</p>

          <div class="d-flex justify-content-center mb-4">
            <UVCircle :uv-index="uvIndex" />
          </div>

          <div class="mb-4">
            <label class="form-label fw-semibold">Your skin type</label>
            <select v-model="selectedSkinType" class="form-select">
              <option v-for="s in skinTypes" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>

          <div v-if="safeMinutes !== null" class="alert alert-info mb-4" role="alert">
            <strong>Safe exposure time: {{ safeMinutes }} minutes</strong>
            <p class="mb-0 mt-1 small">
              At UV Index {{ uvIndex }}, unprotected skin (Type {{ selectedSkinType }}) can be exposed for
              approximately {{ safeMinutes }} minutes before first-degree sunburn may begin.
              Sunscreen extends this time significantly — apply and reapply as recommended.
            </p>
          </div>

          <div v-if="spf" class="card mb-4">
            <div class="card-header fw-semibold">
              Sunscreen Recommendation (Cancer Council Australia)
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">
                <strong>SPF:</strong> {{ spf.spf }}
              </li>
              <li class="list-group-item">
                <strong>Reapply:</strong> {{ spf.reapply }}
              </li>
              <li class="list-group-item text-muted small">
                {{ spf.detail }}
              </li>
            </ul>
          </div>

          <div class="card mb-4">
            <div class="card-header fw-semibold">How much sunscreen to apply</div>
            <div class="card-body">
              <p class="small text-muted mb-2">
                Cancer Council Australia recommends <strong>1 teaspoon (5 ml)</strong> per body part,
                applied 20 minutes before sun exposure.
              </p>
              <ul class="list-unstyled mb-0">
                <li v-for="part in BODY_PARTS" :key="part" class="d-flex gap-2 py-1 border-bottom">
                  <span>~1 tsp</span>
                  <span>{{ part }}</span>
                </li>
                <li class="d-flex gap-2 py-1 fw-semibold">
                  <span>~7 tsp total</span>
                  <span>for full body coverage</span>
                </li>
              </ul>
            </div>
          </div>

          <div v-if="uvIndex >= 3" class="alert alert-warning small" role="alert">
            <strong>Additional protection:</strong> Seek shade, wear a broad-brimmed hat,
            UV-protective sunglasses, and cover-up clothing — especially between 10am and 4pm.
          </div>
        </template>

        <template v-else>
          <div class="text-center text-muted py-5">
            <p>Enter your suburb or postcode above to get personalised sunscreen guidance.</p>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>
