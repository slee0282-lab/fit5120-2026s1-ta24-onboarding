import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useLocationStore = defineStore('location', () => {
  const query = ref<string | null>(null)
  const uvIndex = ref<number | null>(null)
  const locationName = ref<string | null>(null)

  function setLocation(q: string, uv: number, name: string) {
    query.value = q
    uvIndex.value = uv
    locationName.value = name
  }

  function clear() {
    query.value = null
    uvIndex.value = null
    locationName.value = null
  }

  return { query, uvIndex, locationName, setLocation, clear }
})
