import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useLocationStore = defineStore('location', () => {
  const query = ref<string | null>(null)
  const realtimeUvIndex = ref<number | null>(null)
  const selectedHourlyUvIndex = ref<number | null>(null)
  const selectedHourlyTime = ref<string | null>(null)
  const uvIndex = computed(() => selectedHourlyUvIndex.value ?? realtimeUvIndex.value)
  const locationName = ref<string | null>(null)

  function setLocation(q: string, uv: number, name: string) {
    query.value = q
    realtimeUvIndex.value = uv
    selectedHourlyUvIndex.value = null
    selectedHourlyTime.value = null
    locationName.value = name
  }

  function toggleHourlyUv(uv: number, time: string) {
    const alreadySelected =
      selectedHourlyUvIndex.value === uv && selectedHourlyTime.value === time

    if (alreadySelected) {
      selectedHourlyUvIndex.value = null
      selectedHourlyTime.value = null
      return
    }

    selectedHourlyUvIndex.value = uv
    selectedHourlyTime.value = time
  }

  function clear() {
    query.value = null
    realtimeUvIndex.value = null
    selectedHourlyUvIndex.value = null
    selectedHourlyTime.value = null
    locationName.value = null
  }

  return {
    query,
    uvIndex,
    realtimeUvIndex,
    selectedHourlyUvIndex,
    selectedHourlyTime,
    locationName,
    setLocation,
    toggleHourlyUv,
    clear,
  }
})
