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
  // At UV ≥ 6 Cancer Council NSW (CCNSW) recommends SPF 50+ for everyone regardless of skin type.
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
  { id: 'face', label: 'Face, head and neck', tsp: 1 },
  { id: 'left-upper-arm', label: 'Left upper arm', tsp: 0.5 },
  { id: 'right-upper-arm', label: 'Right upper arm', tsp: 0.5 },
  { id: 'left-lower-arm', label: 'Left forearm', tsp: 0.5 },
  { id: 'right-lower-arm', label: 'Right forearm', tsp: 0.5 },
  { id: 'body-front', label: 'Body (front)', tsp: 1 },
  { id: 'body-back', label: 'Body (back)', tsp: 1 },
  { id: 'left-upper-leg', label: 'Left upper leg', tsp: 0.5 },
  { id: 'right-upper-leg', label: 'Right upper leg', tsp: 0.5 },
  { id: 'left-lower-leg', label: 'Left lower leg', tsp: 0.5 },
  { id: 'right-lower-leg', label: 'Right lower leg', tsp: 0.5 },
] as const

type BodyPartId = (typeof BODY_PARTS)[number]['id']

const appliedParts = ref<Set<string>>(new Set())
const mirroredSelection = ref(true)

const PAIRED_PARTS: Record<string, string> = {
  'left-upper-arm': 'right-upper-arm',
  'right-upper-arm': 'left-upper-arm',
  'left-lower-arm': 'right-lower-arm',
  'right-lower-arm': 'left-lower-arm',
  'left-upper-leg': 'right-upper-leg',
  'right-upper-leg': 'left-upper-leg',
  'left-lower-leg': 'right-lower-leg',
  'right-lower-leg': 'left-lower-leg',
}

const PAIR_LABELS: Record<string, string> = {
  'left-upper-arm': 'left and right upper arms',
  'left-lower-arm': 'left and right forearms',
  'left-upper-leg': 'left and right upper legs',
  'left-lower-leg': 'left and right lower legs',
}

function togglePart(id: string) {
  const partner = mirroredSelection.value ? PAIRED_PARTS[id] : undefined
  if (appliedParts.value.has(id)) {
    appliedParts.value.delete(id)
    if (partner) appliedParts.value.delete(partner)
  } else {
    appliedParts.value.add(id)
    if (partner) appliedParts.value.add(partner)
  }
  appliedParts.value = new Set(appliedParts.value)
}

function resetParts() {
  appliedParts.value = new Set()
}

const appliedCount = computed(() => appliedParts.value.size)
const allCovered = computed(() => appliedParts.value.size === BODY_PARTS.length)
const unselectedTsp = computed(() =>
  BODY_PARTS
    .filter((part) => !appliedParts.value.has(part.id))
    .reduce((sum, part) => sum + part.tsp, 0),
)
const unselectedMl = computed(() => unselectedTsp.value * 5)

const totalTsp = computed(() => BODY_PARTS.reduce((sum, part) => sum + part.tsp, 0))
const totalMl = computed(() => totalTsp.value * 5)

const uncoveredSummary = computed(() => {
  const uncovered = BODY_PARTS.filter(p => !appliedParts.value.has(p.id))
  const seen = new Set<string>()
  const result: { label: string; tsp: number }[] = []
  for (const part of uncovered) {
    if (seen.has(part.id)) continue
    const partnerId = PAIRED_PARTS[part.id]
    if (partnerId && !appliedParts.value.has(partnerId) && PAIR_LABELS[part.id]) {
      result.push({ label: PAIR_LABELS[part.id], tsp: part.tsp * 2 })
      seen.add(part.id)
      seen.add(partnerId)
    } else {
      result.push({ label: part.label.toLowerCase(), tsp: part.tsp })
      seen.add(part.id)
    }
  }
  return result
})

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
                  <span class="fw-semibold">Recommended Sunscreen Dosage</span>
                  <button class="btn btn-sm btn-outline-secondary" @click="resetParts">Reset</button>
                </div>
                <div class="card-body">
                  <div class="alert alert-info small mb-3" role="alert">
                    <span v-if="unselectedTsp > 0">
                      Apply <strong>~{{ unselectedTsp }} teaspoon<span v-if="unselectedTsp !== 1">s</span> ({{ unselectedMl }} ml)</strong>
                      of sunscreen, 20 minutes before going outside. Reapply every <strong>2 hours</strong>.
                      <ul v-if="uncoveredSummary.length > 0" class="mb-0 mt-1 ps-3">
                        <li v-for="item in uncoveredSummary" :key="item.label">
                          ~{{ item.tsp }} tsp to {{ item.label }}
                        </li>
                      </ul>
                    </span>
                    <span v-else>
                      All areas covered — no additional sunscreen needed.
                    </span>
                  </div>

                  <p class="small text-muted mb-3">
                    Based on your outfit, tap the areas of your body that are covered.
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
                      <!-- Mirrored toggle -->
                      <g
                        class="diagram-toggle"
                        role="checkbox"
                        :aria-checked="mirroredSelection"
                        transform="translate(40 0)"
                        tabindex="0"
                        @click="mirroredSelection = !mirroredSelection"
                        @keydown.enter.prevent="mirroredSelection = !mirroredSelection"
                        @keydown.space.prevent="mirroredSelection = !mirroredSelection"
                      >
                        <title>Mirrored selection</title>
                        <rect x="90" y="170" width="46" height="18" rx="3" class="diagram-toggle-pill" />
                        <rect
                          x="94"
                          y="174"
                          width="10"
                          height="10"
                          rx="1.5"
                          class="diagram-toggle-box"
                          :class="{ 'diagram-toggle-box--checked': mirroredSelection }"
                        />
                        <text v-if="mirroredSelection" x="99" y="182" text-anchor="middle" class="diagram-toggle-check">✓</text>
                        <text x="107" y="182" class="diagram-toggle-label">Mirror</text>
                      </g>

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
                        <path d="M62 44 H78 A18 18 0 0 1 96 62 V78 H44 V62 A18 18 0 0 1 62 44 Z" />
                        <text v-if="!appliedParts.has('body-front')" x="70" y="65" text-anchor="middle" class="part-label">Front</text>
                        <text v-if="appliedParts.has('body-front')" x="70" y="65" text-anchor="middle" class="check-text">Front ✓</text>
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
                        <path d="M44 78 H96 V94 A18 18 0 0 1 78 112 H62 A18 18 0 0 1 44 94 Z" />
                        <text v-if="!appliedParts.has('body-back')" x="70" y="97" text-anchor="middle" class="part-label">Back</text>
                        <text v-if="appliedParts.has('body-back')" x="70" y="99" text-anchor="middle" class="check-text">Back ✓</text>
                      </g>

                      <!-- Left upper arm -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('left-upper-arm') }"
                        @click="togglePart('left-upper-arm')"
                        role="button"
                        tabindex="0"
                        aria-label="Left upper arm"
                        @keydown.enter="togglePart('left-upper-arm')"
                      >
                        <title>Left upper arm</title>
                        <path d="M32 51 H34 A7 7 0 0 1 41 58 V81 H25 V58 A7 7 0 0 1 32 51 Z" />
                        <text v-if="appliedParts.has('left-upper-arm')" x="33" y="70" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Left lower arm -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('left-lower-arm') }"
                        @click="togglePart('left-lower-arm')"
                        role="button"
                        tabindex="0"
                        aria-label="Left lower arm"
                        @keydown.enter="togglePart('left-lower-arm')"
                      >
                        <title>Left lower arm</title>
                        <path d="M25 81 H41 V108 A7 7 0 0 1 34 115 H32 A7 7 0 0 1 25 108 Z" />
                        <text v-if="appliedParts.has('left-lower-arm')" x="33" y="102" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Right upper arm -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('right-upper-arm') }"
                        @click="togglePart('right-upper-arm')"
                        role="button"
                        tabindex="0"
                        aria-label="Right upper arm"
                        @keydown.enter="togglePart('right-upper-arm')"
                      >
                        <title>Right upper arm</title>
                        <path d="M106 51 H108 A7 7 0 0 1 115 58 V81 H99 V58 A7 7 0 0 1 106 51 Z" />
                        <text v-if="appliedParts.has('right-upper-arm')" x="107" y="70" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Right lower arm -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('right-lower-arm') }"
                        @click="togglePart('right-lower-arm')"
                        role="button"
                        tabindex="0"
                        aria-label="Right lower arm"
                        @keydown.enter="togglePart('right-lower-arm')"
                      >
                        <title>Right lower arm</title>
                        <path d="M99 81 H115 V108 A7 7 0 0 1 108 115 H106 A7 7 0 0 1 99 108 Z" />
                        <text v-if="appliedParts.has('right-lower-arm')" x="107" y="102" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Left upper leg -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('left-upper-leg') }"
                        @click="togglePart('left-upper-leg')"
                        role="button"
                        tabindex="0"
                        aria-label="Left upper leg"
                        @keydown.enter="togglePart('left-upper-leg')"
                      >
                        <title>Left upper leg</title>
                        <path d="M53,113 H58 a8,8 0 0 1 8,8 V149 H45 V121 a8,8 0 0 1 8,-8 Z" />
                        <text v-if="appliedParts.has('left-upper-leg')" x="55" y="135" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Left lower leg -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('left-lower-leg') }"
                        @click="togglePart('left-lower-leg')"
                        role="button"
                        tabindex="0"
                        aria-label="Left lower leg"
                        @keydown.enter="togglePart('left-lower-leg')"
                      >
                        <title>Left lower leg</title>
                        <path d="M45,149 H66 V175 a8,8 0 0 1 -8,8 H53 a8,8 0 0 1 -8,-8 Z" />
                        <text v-if="appliedParts.has('left-lower-leg')" x="55" y="170" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Right upper leg -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('right-upper-leg') }"
                        @click="togglePart('right-upper-leg')"
                        role="button"
                        tabindex="0"
                        aria-label="Right upper leg"
                        @keydown.enter="togglePart('right-upper-leg')"
                      >
                        <title>Right upper leg</title>
                        <path d="M82,113 H87 a8,8 0 0 1 8,8 V149 H74 V121 a8,8 0 0 1 8,-8 Z" />
                        <text v-if="appliedParts.has('right-upper-leg')" x="84" y="135" text-anchor="middle" class="check-text">✓</text>
                      </g>

                      <!-- Right lower leg -->
                      <g
                        class="body-zone"
                        :class="{ 'body-zone--applied': appliedParts.has('right-lower-leg') }"
                        @click="togglePart('right-lower-leg')"
                        role="button"
                        tabindex="0"
                        aria-label="Right lower leg"
                        @keydown.enter="togglePart('right-lower-leg')"
                      >
                        <title>Right lower leg</title>
                        <path d="M74,149 H95 V175 a8,8 0 0 1 -8,8 H82 a8,8 0 0 1 -8,-8 Z" />
                        <text v-if="appliedParts.has('right-lower-leg')" x="84" y="170" text-anchor="middle" class="check-text">✓</text>
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
                      <span class="ms-auto small text-muted">~{{ part.tsp }} tsp</span>
                    </li>
                    <li class="checklist-row checklist-row--total">
                      <span class="checklist-icon"></span>
                      <span class="fw-semibold">Still needed</span>
                      <span class="ms-auto small fw-semibold">~{{ unselectedTsp }} tsp / {{ unselectedMl }} ml</span>
                    </li>
                  </ul>

                  <!-- All covered badge -->
                  <div v-if="allCovered" class="alert alert-success mt-3 mb-0 text-center" role="alert">
                    <strong>All areas covered — you're protected!</strong>
                  </div>
                </div>
              </div>
              <p class="text-muted mt-2" style="font-size: 11px">
                © Cancer Council NSW (CCNSW). All rights reserved.
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
                © Cancer Council NSW (CCNSW). All rights reserved.
                SPF guidance sourced from Cancer Council NSW (CCNSW)'s SunSmart sun protection guidelines,
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
  overflow: visible;
}

.diagram-toggle {
  cursor: pointer;
}

.diagram-toggle-pill {
  fill: #f8f9fa;
  stroke: #ced4da;
  stroke-width: 1;
}

.diagram-toggle-box {
  fill: white;
  stroke: #adb5bd;
  stroke-width: 1;
}

.diagram-toggle-box--checked {
  fill: #198754;
  stroke: #146c43;
}

.diagram-toggle-check {
  fill: white;
  font-size: 9px;
  font-family: system-ui, sans-serif;
  pointer-events: none;
}

.diagram-toggle-label {
  fill: #6c757d;
  font-size: 8px;
  font-family: system-ui, sans-serif;
  pointer-events: none;
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

.part-label {
  fill: #868e96;
  font-size: 9px;
  font-weight: normal;
  font-family: system-ui, sans-serif;
  pointer-events: none;
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
