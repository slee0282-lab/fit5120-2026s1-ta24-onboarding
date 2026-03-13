<script setup lang="ts">
const props = defineProps<{
  uvIndex: number | null
}>()

interface AlertLevel {
  show: boolean
  variant: string
  message: string
  action: string
}

function getAlert(uv: number): AlertLevel {
  if (uv <= 2) {
    return { show: false, variant: 'success', message: '', action: '' }
  }
  if (uv <= 5) {
    return {
      show: true,
      variant: 'warning',
      message: `UV Index ${uv} — Moderate`,
      action: 'Wear sunscreen SPF 30+ and a hat if outside for extended periods.',
    }
  }
  if (uv <= 7) {
    return {
      show: true,
      variant: 'warning',
      message: `UV Index ${uv} — High`,
      action: 'Apply SPF 50+ sunscreen, wear protective clothing and seek shade between 10am–4pm.',
    }
  }
  if (uv <= 10) {
    return {
      show: true,
      variant: 'danger',
      message: `UV Index ${uv} — Very High`,
      action: 'Avoid sun exposure where possible. Use SPF 50+, sunglasses, hat and protective clothing.',
    }
  }
  return {
    show: true,
    variant: 'danger',
    message: `UV Index ${uv} — Extreme`,
    action: 'Stay indoors if possible. Full protection essential: SPF 50+, hat, sunglasses, long sleeves.',
  }
}

import { computed } from 'vue'

const alert = computed(() =>
  props.uvIndex !== null ? getAlert(props.uvIndex) : null
)
</script>

<template>
  <div
    v-if="alert && alert.show"
    class="alert"
    :class="`alert-${alert.variant}`"
    role="alert"
  >
    <strong>{{ alert.message }}</strong>
    <p class="mb-0 mt-1">{{ alert.action }}</p>
  </div>
</template>
