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
  const displayUv = uv.toFixed(1)
  if (uv < 3) {
    return {
      show: true,
      variant: 'success',
      message: `UV Index ${displayUv} - Low`,
      action: 'It is still recommended to wear sunscreen if outside for extended periods, though not necessary.',
    }
  }
  if (uv < 6) {
    return {
      show: true,
      variant: 'warning',
      message: `UV Index ${displayUv} - Moderate`,
      action: 'Apply SPF 30+ sunscreen to exposed skin, and a hat if outside for extended periods.',
    }
  }
  if (uv < 8) {
    return {
      show: true,
      variant: 'warning',
      message: `UV Index ${displayUv} - High`,
      action: 'Apply SPF 50+ sunscreen, wear protective clothing and seek shade at peak hours.',
    }
  }
  if (uv < 11) {
    return {
      show: true,
      variant: 'danger',
      message: `UV Index ${displayUv} - Very High`,
      action: 'Avoid sun exposure where possible. Use SPF 50+, sunglasses, hat and protective clothing.',
    }
  }
  return {
    show: true,
    variant: 'danger',
    message: `UV Index ${displayUv} - Extreme`,
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
    <strong class="small">{{ alert.message }}</strong>
    <p class="mb-0 mt-1 small">{{ alert.action }}</p>
  </div>
</template>

<style scoped>
.alert {
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 16px;
}
</style>
