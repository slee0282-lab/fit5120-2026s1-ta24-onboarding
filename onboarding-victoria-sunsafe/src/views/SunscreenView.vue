<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import UVCircle from '../components/UVCircle.vue'
import { useLocationStore } from '../stores/location'

const store = useLocationStore()

const selectedSkinType = ref<1 | 2 | 3 | 4>(2)

const skinTypes = [
  { value: 1 as const, label: 'Type I',   detail: 'Always burns, never tans',     color: '#FBEAC8' },
  { value: 2 as const, label: 'Type II',  detail: 'Usually burns, sometimes tans', color: '#F0C89B' },
  { value: 3 as const, label: 'Type III', detail: 'Sometimes burns, usually tans', color: '#C88B5A' },
  { value: 4 as const, label: 'Type IV',  detail: 'Rarely burns, always tans',     color: '#8B5E3C' },
]

// Lower bound of 95% CI — Sánchez-Pérez et al. (2019), Sci Rep 9, 733, Table 4
const burnDose: Record<number, number> = { 1: 83.23, 2: 113.20, 3: 138.43, 4: 190.81 }
const KW_TO_W_FACTOR = Math.pow(1000, 4 / 3)  // unit conversion (kW→W)^(4/3)

function calcSafeMinutes(uvi: number, skinType: 1 | 2 | 3 | 4): number {
  const iUV = 15.1 * uvi + 35.5              // W/m² — Eq. (4) Sánchez-Pérez et al.
  const iUV43 = Math.pow(iUV, 4 / 3)
  const dThreshold = (burnDose[skinType] ?? 113.20) * KW_TO_W_FACTOR
  return Math.round(dThreshold / iUV43 / 60)
}

const uvIndex = computed(() => store.uvIndex)
const locationName = computed(() => store.locationName)

const safeMinutes = computed(() => {
  if (uvIndex.value === null || uvIndex.value === 0) return null
  return calcSafeMinutes(uvIndex.value, selectedSkinType.value)
})

function spfRecommendation(uvi: number, skinType: 1 | 2 | 3 | 4): { spf: string; reapply: string; detail: string } {
  // At UV ≥ 6 Cancer Council recommends SPF 50+ for everyone regardless of skin type.
  // At UV 3–5 (Moderate), Types I/II (burns easily) warrant SPF 50+; Types III/IV SPF 30+.
  // At UV ≤ 2 (Low) differentiation matters most: fairer skin still needs SPF 30+.
  if (uvi <= 2) {
    if (skinType <= 2) return { spf: 'SPF 30+', reapply: 'Not required for brief exposure', detail: 'Low UV — your skin type burns easily, so SPF 30+ is advisable even in low UV.' }
    if (skinType === 3) return { spf: 'SPF 15+', reapply: 'Not required for brief exposure', detail: 'Low UV — minimal protection needed; apply if outdoors for extended periods.' }
    return               { spf: 'Not required', reapply: 'N/A',                              detail: 'Low UV — your skin type is unlikely to burn in low UV conditions.' }
  }
  if (uvi <= 5) {
    if (skinType <= 2) return { spf: 'SPF 50+', reapply: 'Every 2 hours outdoors',           detail: 'Moderate UV — your skin type burns readily; SPF 50+ gives maximum protection.' }
    return               { spf: 'SPF 30+', reapply: 'Every 2 hours outdoors',                detail: 'Moderate UV — apply generously 20 minutes before going outside.' }
  }
  if (uvi <= 7)  return { spf: 'SPF 50+', reapply: 'Every 2 hours (more often if sweating or swimming)', detail: 'High UV — use sunscreen, hat, sunglasses, and protective clothing.' }
  if (uvi <= 10) return { spf: 'SPF 50+', reapply: 'Every 1–2 hours',                                    detail: 'Very High UV — seek shade between 10am–4pm. Full protection required.' }
  return           { spf: 'SPF 50+', reapply: 'Every hour',                                               detail: 'Extreme UV — avoid going outdoors if possible. Stay in shade and cover all exposed skin.' }
}

const spf = computed(() => (uvIndex.value !== null ? spfRecommendation(uvIndex.value, selectedSkinType.value) : null))

// --- Interactive body parts ---
const BODY_PARTS = [
  { id: 'face',        label: 'Face, head and neck' },
  { id: 'left-arm',   label: 'Left arm' },
  { id: 'right-arm',  label: 'Right arm' },
  { id: 'body-front', label: 'Body (front)' },
  { id: 'body-back',  label: 'Body (back)' },
  { id: 'left-leg',   label: 'Left leg' },
  { id: 'right-leg',  label: 'Right leg' },
]

const appliedParts = ref<Set<string>>(new Set())

function togglePart(id: string) {
  if (appliedParts.value.has(id)) {
    appliedParts.value.delete(id)
  } else {
    appliedParts.value.add(id)
  }
  appliedParts.value = new Set(appliedParts.value)
}

function resetParts() {
  appliedParts.value = new Set()
}

const appliedCount = computed(() => appliedParts.value.size)
const allCovered = computed(() => appliedParts.value.size === BODY_PARTS.length)
const selectedTsp = computed(() => appliedParts.value.size)
const selectedMl = computed(() => appliedParts.value.size * 5)

watch(() => store.locationName, () => {
  appliedParts.value = new Set()
})
</script>

<template>
  <main class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10 col-xl-9">
        <h1 class="mb-1">Sunscreen Guide</h1>
        <p class="text-muted mb-4">
          Based on your UV level and skin type, find out how long you can safely stay outside
          and how much sunscreen to apply.
        </p>

        <!-- No location in store — redirect prompt -->
        <template v-if="uvIndex === null">
          <div class="text-center py-5">
            <p class="text-muted mb-3">
              Please check your UV Index first so we can personalise the guide for you.
            </p>
            <RouterLink to="/" class="btn btn-primary">← Check UV Index</RouterLink>
          </div>
        </template>

        <template v-else>
          <p v-if="locationName" class="text-center text-muted mb-2">{{ locationName }}</p>

          <div class="d-flex justify-content-center mb-4">
            <UVCircle :uv-index="uvIndex" />
          </div>

          <!-- Skin type selector — radio cards with colour swatches -->
          <div class="mb-1">
            <label class="form-label fw-semibold">Your skin type</label>
            <div class="skin-type-grid">
              <label
                v-for="s in skinTypes"
                :key="s.value"
                class="skin-type-card"
                :class="{ 'skin-type-card--selected': selectedSkinType === s.value }"
              >
                <input type="radio" :value="s.value" v-model="selectedSkinType" class="visually-hidden" />
                <div class="skin-swatch" :style="{ background: s.color }"></div>
                <div class="mt-2 text-center">
                  <div class="fw-semibold" style="font-size: 13px">{{ s.label }}</div>
                  <div style="font-size: 11px; color: #6c757d; line-height: 1.3">{{ s.detail }}</div>
                </div>
              </label>
            </div>
          </div>
          <p class="text-muted mb-4" style="font-size: 11px">
            Fitzpatrick scale — select the type that best matches your natural skin sensitivity to sun
          </p>

          <!-- Two-column layout: body diagram LEFT, recommendations RIGHT -->
          <div class="row g-4">

            <!-- LEFT: Body diagram card -->
            <div class="col-12 col-lg-6">
              <div class="card">
                <div class="card-header d-flex align-items-center justify-content-between">
                  <span class="fw-semibold">How much sunscreen to apply</span>
                  <button class="btn btn-sm btn-outline-secondary" @click="resetParts">Reset</button>
                </div>
                <div class="card-body">
                  <p class="small text-muted mb-3">
                    Apply <strong>1 teaspoon (5 ml)</strong> per body part, 20 minutes before sun exposure.
                    Tap a zone on the diagram or the list below to mark it as covered.
                  </p>

                  <!-- Progress bar -->
                  <div class="d-flex align-items-center gap-2 mb-3">
                    <div class="progress flex-grow-1" style="height: 8px">
                      <div
                        class="progress-bar bg-success"
                        :style="{ width: `${(appliedCount / BODY_PARTS.length) * 100}%` }"
                        role="progressbar"
                      ></div>
                    </div>
                    <span class="small text-muted text-nowrap">{{ appliedCount }} / {{ BODY_PARTS.length }} covered</span>
                  </div>

                  <!-- SVG body diagram -->
                  <div class="d-flex justify-content-center mb-3">
                    <svg
                      viewBox="0 0 140 192"
                      class="body-diagram"
                      role="img"
                      aria-label="Body diagram — tap zones to mark sunscreen applied"
                    >
                      <!-- Face, head and neck -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('face') }"
                        @click="togglePart('face')"
                        role="button"
                        tabindex="0"
                        aria-label="Face, head and neck"
                        @keydown.enter="togglePart('face')"
                      >
                        <title>Face, head and neck</title>
                        <circle cx="70" cy="20" r="16" />
                        <rect x="63" y="35" width="14" height="9" rx="2" />
                        <text v-if="appliedParts.has('face')" x="70" y="25" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Body front (top half of torso) -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('body-front') }"
                        @click="togglePart('body-front')"
                        role="button"
                        tabindex="0"
                        aria-label="Body front"
                        @keydown.enter="togglePart('body-front')"
                      >
                        <title>Body (front)</title>
                        <rect x="38" y="44" width="64" height="26" rx="5" />
                        <text x="70" y="58" text-anchor="middle" class="arm-label" :class="{ 'arm-label--hidden': appliedParts.has('body-front') }">Front</text>
                        <text v-if="appliedParts.has('body-front')" x="70" y="62" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Body back (bottom half of torso) -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('body-back') }"
                        @click="togglePart('body-back')"
                        role="button"
                        tabindex="0"
                        aria-label="Body back"
                        @keydown.enter="togglePart('body-back')"
                      >
                        <title>Body (back)</title>
                        <rect x="38" y="71" width="64" height="27" rx="5" />
                        <text x="70" y="87" text-anchor="middle" class="arm-label" :class="{ 'arm-label--hidden': appliedParts.has('body-back') }">Back</text>
                        <text v-if="appliedParts.has('body-back')" x="70" y="87" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Left arm (viewer's left) -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('left-arm') }"
                        @click="togglePart('left-arm')"
                        role="button"
                        tabindex="0"
                        aria-label="Left arm"
                        @keydown.enter="togglePart('left-arm')"
                      >
                        <title>Left arm</title>
                        <rect x="17" y="44" width="20" height="54" rx="8" />
                        <text x="27" y="68" text-anchor="middle" class="arm-label" :class="{ 'arm-label--hidden': appliedParts.has('left-arm') }">L</text>
                        <text v-if="appliedParts.has('left-arm')" x="27" y="72" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Right arm (viewer's right) -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('right-arm') }"
                        @click="togglePart('right-arm')"
                        role="button"
                        tabindex="0"
                        aria-label="Right arm"
                        @keydown.enter="togglePart('right-arm')"
                      >
                        <title>Right arm</title>
                        <rect x="103" y="44" width="20" height="54" rx="8" />
                        <text x="113" y="68" text-anchor="middle" class="arm-label" :class="{ 'arm-label--hidden': appliedParts.has('right-arm') }">R</text>
                        <text v-if="appliedParts.has('right-arm')" x="113" y="72" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Left leg (user's left = viewer's right) -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('left-leg') }"
                        @click="togglePart('left-leg')"
                        role="button"
                        tabindex="0"
                        aria-label="Left leg"
                        @keydown.enter="togglePart('left-leg')"
                      >
                        <title>Left leg</title>
                        <rect x="72" y="98" width="28" height="78" rx="8" />
                        <text v-if="appliedParts.has('left-leg')" x="86" y="140" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Right leg (user's right = viewer's left) -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('right-leg') }"
                        @click="togglePart('right-leg')"
                        role="button"
                        tabindex="0"
                        aria-label="Right leg"
                        @keydown.enter="togglePart('right-leg')"
                      >
                        <title>Right leg</title>
                        <rect x="40" y="98" width="28" height="78" rx="8" />
                        <text v-if="appliedParts.has('right-leg')" x="54" y="140" text-anchor="middle" class="check-text">✓</text>
                      </g>
                    </svg>
                  </div>

                  <!-- Text checklist (mirrors diagram state) -->
                  <ul class="list-unstyled mb-0">
                    <li
                      v-for="part in BODY_PARTS"
                      :key="part.id"
                      class="checklist-row"
                      :class="{ 'checklist-row--applied': appliedParts.has(part.id) }"
                      @click="togglePart(part.id)"
                      role="checkbox"
                      :aria-checked="appliedParts.has(part.id)"
                      tabindex="0"
                      @keydown.enter="togglePart(part.id)"
                    >
                      <span class="checklist-icon">{{ appliedParts.has(part.id) ? '✓' : '○' }}</span>
                      <span :class="{ 'text-decoration-line-through text-muted': appliedParts.has(part.id) }">
                        {{ part.label }}
                      </span>
                      <span class="ms-auto small text-muted">~1 tsp</span>
                    </li>
                    <li class="checklist-row checklist-row--total">
                      <span class="checklist-icon"></span>
                      <span class="fw-semibold">Total for selected parts</span>
                      <span class="ms-auto small fw-semibold">{{ selectedTsp }} tsp / {{ selectedMl }} ml</span>
                    </li>
                  </ul>

                  <!-- All covered badge -->
                  <div v-if="allCovered" class="alert alert-success mt-3 mb-0 text-center" role="alert">
                    <strong>All areas covered — you're protected!</strong>
                  </div>
                </div>
              </div>
              <p class="text-muted mt-2" style="font-size: 11px">
                © Cancer Council Australia. All rights reserved.
                "The average adult needs about 35 mL (around 7 teaspoons) for full-body coverage –
                at least one teaspoon each for your arms, legs, front, back, face/neck/ears."
                Reproduced for non-commercial educational purposes.
                <a href="https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety/sunscreen/advice" target="_blank" rel="noopener">cancer.org.au</a>
              </p>
            </div>

            <!-- RIGHT: Recommendations -->
            <div class="col-12 col-lg-6">
              <!-- Safe exposure time -->
              <div v-if="safeMinutes !== null" class="alert alert-info mb-1" role="alert">
                <strong>Your skin will burn in {{ safeMinutes }} minutes</strong>
                <p class="mb-0 mt-1 small">
                  At UV Index {{ uvIndex }}, unprotected skin (Type {{ selectedSkinType }}) can be exposed for
                  approximately {{ safeMinutes }} minutes before first-degree sunburn may begin.
                  Sunscreen extends this time significantly — apply and reapply as recommended.
                </p>
              </div>
              <p v-if="safeMinutes !== null" class="text-muted mb-4" style="font-size: 11px">
                Source: Sánchez-Pérez et al. (2019), <em>Sci Rep</em> 9, 733 (CC BY 4.0) ·
                Formula: t<sub>e</sub> = D<sub>UV</sub> / I<sub>UV</sub><sup>4/3</sup> ·
                Dose threshold = lower bound of 95% CI for safety
              </p>

              <!-- SPF recommendation -->
              <div v-if="spf" class="card mb-1">
                <div class="card-header fw-semibold">Sunscreen Recommendation</div>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item"><strong>SPF:</strong> {{ spf.spf }}</li>
                  <li class="list-group-item"><strong>Reapply:</strong> {{ spf.reapply }}</li>
                  <li class="list-group-item text-muted small">{{ spf.detail }}</li>
                </ul>
              </div>
              <p v-if="spf" class="text-muted mb-4" style="font-size: 11px">
                © Cancer Council Australia. All rights reserved.
                SPF guidance sourced from Cancer Council Australia's SunSmart sun protection guidelines,
                reproduced for non-commercial educational purposes.
                <a href="https://www.cancer.org.au" target="_blank" rel="noopener">cancer.org.au</a>
                · Safe exposure time: Sánchez-Pérez et al. (2019), <em>Sci Rep</em> 9, 733
              </p>

              <!-- Additional protection warning -->
              <div v-if="uvIndex >= 3" class="alert alert-warning small" role="alert">
                <strong>Additional protection:</strong> Seek shade, wear a broad-brimmed hat,
                UV-protective sunglasses, and cover-up clothing — especially between 10am and 4pm.
              </div>
            </div>

          </div>
        </template>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ── Skin type radio cards ── */
.skin-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

@media (min-width: 576px) {
  .skin-type-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.skin-type-card {
  border: 2px solid #dee2e6;
  border-radius: 10px;
  padding: 10px 8px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
  display: block;
}

.skin-type-card:hover {
  border-color: #adb5bd;
}

.skin-type-card--selected {
  border-color: #0d6efd;
  background-color: #f0f7ff;
}

.skin-swatch {
  height: 38px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* ── SVG body diagram ── */
.body-diagram {
  width: 100%;
  max-width: 180px;
  height: auto;
}

.body-zone {
  cursor: pointer;
  fill: #e9ecef;
  stroke: #adb5bd;
  stroke-width: 1.5;
  transition: fill 0.18s ease;
}

.body-zone:not(.body-zone--inactive):hover {
  fill: #c3e6cb;
}

.body-zone--applied {
  fill: #198754;
  stroke: #146c43;
}

.body-zone--inactive {
  cursor: default;
  fill: #f5f5f5;
  stroke: #e0e0e0;
  pointer-events: none;
}

.check-text {
  fill: white;
  font-size: 10px;
  font-family: system-ui, sans-serif;
  pointer-events: none;
}

.check-text--lg {
  font-size: 18px;
}

.arm-label {
  fill: #868e96;
  font-size: 9px;
  font-weight: bold;
  font-family: system-ui, sans-serif;
  pointer-events: none;
}

.arm-label--hidden {
  fill: transparent;
}

.figure-label {
  fill: #6c757d;
  font-size: 10px;
  font-family: system-ui, sans-serif;
  pointer-events: none;
}

/* ── Text checklist ── */
.checklist-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.12s;
}

.checklist-row:hover:not(.checklist-row--total) {
  background-color: #f8f9fa;
}

.checklist-row--applied {
  background-color: #d1e7dd;
}

.checklist-row--applied:hover {
  background-color: #c3e6cb !important;
}

.checklist-row--total {
  cursor: default;
  border-bottom: none;
  border-top: 2px solid #dee2e6;
  padding-top: 8px;
  margin-top: 2px;
}

.checklist-icon {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  color: #198754;
  font-weight: bold;
}
</style>
