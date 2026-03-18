import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export interface HourlyForecastPoint {
  time: string
  uvi: number
}

export const useLocationStore = defineStore('location', () => {
  const query = ref<string | null>(null)
  const realtimeUvIndex = ref<number | null>(null)
  const selectedHourlyUvIndex = ref<number | null>(null)
  const selectedHourlyTime = ref<string | null>(null)
  const uvIndex = computed(() => selectedHourlyUvIndex.value ?? realtimeUvIndex.value)
  const locationName = ref<string | null>(null)
  const fetchedAt = ref<string | null>(null)
  const hourlyForecast = ref<HourlyForecastPoint[]>([])

  function setLocation(q: string, uv: number, name: string) {
    query.value = q
    realtimeUvIndex.value = uv
    selectedHourlyUvIndex.value = null
    selectedHourlyTime.value = null
    locationName.value = name
  }

  function setForecastData(fetchedTime: string, forecast: HourlyForecastPoint[]) {
    fetchedAt.value = fetchedTime
    hourlyForecast.value = forecast
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
    fetchedAt.value = null
    hourlyForecast.value = []
  }

  return {
    query,
    uvIndex,
    realtimeUvIndex,
    selectedHourlyUvIndex,
    selectedHourlyTime,
    locationName,
    fetchedAt,
    hourlyForecast,
    setLocation,
    setForecastData,
    toggleHourlyUv,
    clear,
  }
})
