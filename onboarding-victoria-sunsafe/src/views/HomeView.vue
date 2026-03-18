<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { RouterLink } from "vue-router";
import UVCircle from "../components/UVCircle.vue";
import AlertBanner from "../components/AlertBanner.vue";
import { useLocationStore } from "../stores/location";

const store = useLocationStore();

const uvIndex = ref<number | null>(null);
const locationName = ref<string | null>(null);
const fetchedAt = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const loading = ref(false);
const textQuery = ref("");
const selectedCity = ref("");
const showLocationOptions = ref(true);
const hourlyForecast = ref<Array<{ time: string; uvi: number }>>([]);

interface UVApiResponse {
  uv_index: number;
  location: string;
  hourly_forecast?: Array<{ dt: number; uvi: number }>;
  error?: string;
}

const VICTORIA_CITIES = [
  { label: "Melbourne", lat: -37.8136, lon: 144.9631 },
  { label: "Geelong", lat: -38.1499, lon: 144.3617 },
  { label: "Ballarat", lat: -37.5622, lon: 143.8503 },
  { label: "Bendigo", lat: -36.757, lon: 144.2794 },
  { label: "Shepparton", lat: -36.3832, lon: 145.399 },
  { label: "Mildura", lat: -34.2086, lon: 142.1312 },
  { label: "Wodonga", lat: -36.1218, lon: 146.888 },
  { label: "Warrnambool", lat: -38.383, lon: 142.4879 },
  { label: "Horsham", lat: -36.7118, lon: 142.1991 },
  { label: "Traralgon", lat: -38.1958, lon: 146.5428 },
  { label: "Wangaratta", lat: -36.3579, lon: 146.3134 },
  { label: "Sale", lat: -38.1072, lon: 147.0663 },
  { label: "Bairnsdale", lat: -37.8277, lon: 147.6093 },
  { label: "Echuca", lat: -36.1438, lon: 144.7513 },
  { label: "Swan Hill", lat: -35.3378, lon: 143.5552 },
];

let refreshTimer: ReturnType<typeof setInterval> | null = null;

function startRefresh(fn: () => void) {
  if (refreshTimer !== null) clearInterval(refreshTimer);
  refreshTimer = setInterval(fn, 60 * 60 * 1000);
}

function applyResult(data: UVApiResponse, storeQuery: string) {
  uvIndex.value = data.uv_index;
  locationName.value = data.location;
  fetchedAt.value = new Date().toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const now = new Date();
  const isSameDay = (date: Date) =>
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const sameDayForecast = (data.hourly_forecast ?? [])
    .map((entry) => ({
      date: new Date(entry.dt * 1000),
      uvi: entry.uvi,
    }))
    .filter((entry) => isSameDay(entry.date) && entry.date >= now)
    .map((entry) => ({
      time: entry.date.toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      uvi: entry.uvi,
    }));

  hourlyForecast.value =
    sameDayForecast.length > 0
      ? sameDayForecast
      : (data.hourly_forecast ?? []).slice(0, 8).map((entry) => ({
          time: new Date(entry.dt * 1000).toLocaleTimeString("en-AU", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          uvi: entry.uvi,
        }));

  store.setLocation(storeQuery, data.uv_index, data.location);
}

function clearResult() {
  uvIndex.value = null;
  locationName.value = null;
  fetchedAt.value = null;
  hourlyForecast.value = [];
  store.clear();
}

async function fetchUVByQuery(query: string) {
  loading.value = true;
  errorMessage.value = null;
  try {
    const res = await fetch(`/api/uv?${new URLSearchParams({ q: query })}`);
    const data = (await res.json()) as UVApiResponse;
    if (!res.ok) {
      errorMessage.value = data.error ?? "Something went wrong. Please try again.";
      clearResult();
      return;
    }
    applyResult(data, query);
    startRefresh(() => fetchUVByQuery(query));
  } catch {
    errorMessage.value = "UV data is currently unavailable. Please try again later.";
    clearResult();
  } finally {
    loading.value = false;
  }
}

async function fetchUVByCoords(lat: number, lon: number, name: string) {
  loading.value = true;
  errorMessage.value = null;
  try {
    const res = await fetch(
      `/api/uv?${new URLSearchParams({ lat: String(lat), lon: String(lon) })}`
    );
    const data = (await res.json()) as UVApiResponse;
    if (!res.ok) {
      errorMessage.value = data.error ?? "Something went wrong. Please try again.";
      clearResult();
      return;
    }
    applyResult({ ...data, location: name }, name);
    startRefresh(() => fetchUVByCoords(lat, lon, name));
  } catch {
    errorMessage.value = "UV data is currently unavailable. Please try again later.";
    clearResult();
  } finally {
    loading.value = false;
  }
}

function handleCitySelect() {
  const city = VICTORIA_CITIES.find((c) => c.label === selectedCity.value);
  if (city) {
    showLocationOptions.value = false;
    fetchUVByCoords(city.lat, city.lon, `${city.label}, VIC`);
  }
}

function handleTextSearch() {
  const trimmed = textQuery.value.trim();
  if (trimmed) {
    showLocationOptions.value = false;
    fetchUVByQuery(trimmed);
  }
}

function getUvCategory(uvi: number): string {
  if (uvi < 3) return "Low";
  if (uvi < 6) return "Moderate";
  if (uvi < 8) return "High";
  if (uvi < 11) return "Very High";
  return "Extreme";
}

function getUvColor(uvi: number): string {
  if (uvi < 3) return "#4caf50";
  if (uvi < 6) return "#ffeb3b";
  if (uvi < 8) return "#ff9800";
  if (uvi < 11) return "#f44336";
  return "#9c27b0";
}

function getUvTextColor(uvi: number): string {
  return uvi >= 3 && uvi < 6 ? "#333" : "#fff";
}

function getUvBlockHeightPx(uvi: number): number {
  const clamped = Math.max(0, Math.min(11, uvi));
  return Math.round(20 + clamped * 3.6);
}

function getUvBlockHeight(uvi: number): string {
  return `${getUvBlockHeightPx(uvi)}px`;
}

function getForecastSlotHeight(): string {
  const tallest = hourlyForecast.value.reduce(
    (maxHeight, point) => Math.max(maxHeight, getUvBlockHeightPx(point.uvi)),
    20
  );
  return `${tallest + 6}px`;
}

function forecastTooltip(point: { time: string; uvi: number }): string {
  return `${point.time} · ${getUvCategory(point.uvi)} · UV ${point.uvi}`;
}

onUnmounted(() => {
  if (refreshTimer !== null) clearInterval(refreshTimer);
});
</script>

<template>
  <main class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <h1 class="mb-1">UV Index</h1>
        <p :class="'text-muted small mb-2'">
          Check the current UV level for any Victorian suburb or postcode.
        </p>

        <div v-if="showLocationOptions" class="card mb-4">
          <!-- City dropdown -->
          <div
            class="card-body border-bottom d-flex align-items-center justify-content-between gap-3 flex-wrap"
          >
            <div class="fw-semibold">Select a city</div>
            <select
              v-model="selectedCity"
              class="form-select"
              style="max-width: 200px"
              @change="handleCitySelect"
              :disabled="loading"
            >
              <option value="" disabled>Choose city…</option>
              <option
                v-for="city in VICTORIA_CITIES"
                :key="city.label"
                :value="city.label"
              >
                {{ city.label }}
              </option>
            </select>
          </div>

          <!-- Text input -->
          <div class="card-body">
            <div class="fw-semibold mb-2">Or type suburb / postcode</div>
            <form class="d-flex gap-2" @submit.prevent="handleTextSearch">
              <input
                v-model="textQuery"
                type="text"
                class="form-control"
                placeholder="e.g. 3000 or Melbourne"
                maxlength="100"
                aria-label="Suburb or postcode"
                :disabled="loading"
              />
              <button
                type="submit"
                class="btn btn-primary text-nowrap"
                :disabled="loading"
              >
                Check UV
              </button>
            </form>
          </div>
        </div>

        <div v-else class="d-grid mb-4">
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="showLocationOptions = true"
          >
            Select Location
          </button>
        </div>

        <!-- Loading spinner -->
        <div v-if="loading" class="text-center my-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading…</span>
          </div>
        </div>

        <div v-else class="mt-2">
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <template v-else-if="uvIndex !== null">
            <p v-if="locationName" class="text-center text-muted mb-3">
              {{ locationName }}<span v-if="fetchedAt"> · as of {{ fetchedAt }}</span>
            </p>

            <div class="d-flex justify-content-center mb-4">
              <UVCircle :uv-index="uvIndex" />
            </div>

            <AlertBanner :uv-index="uvIndex" />

            <div class="mt-3 mb-4">
              <h6 class="text-muted">UV Categories</h6>
              <div class="d-flex gap-2 flex-wrap">
                <span class="badge" style="background-color: #4caf50">Low (0–2)</span>
                <span class="badge" style="background-color: #ffeb3b; color: #333"
                  >Moderate (3–5)</span
                >
                <span class="badge" style="background-color: #ff9800">High (6–7)</span>
                <span class="badge" style="background-color: #f44336"
                  >Very High (8–10)</span
                >
                <span class="badge" style="background-color: #9c27b0">Extreme (11+)</span>
              </div>
            </div>

            <div v-if="hourlyForecast.length > 0" class="card mb-4">
              <div class="card-header fw-semibold">Today’s UV Forecast</div>
              <div class="card-body py-3">
                <div class="hourly-forecast-row">
                  <div v-for="point in hourlyForecast" :key="point.time" class="hourly-forecast-item">
                    <div class="hourly-forecast-bar-slot" :style="{ height: getForecastSlotHeight() }">
                      <div
                        class="hourly-forecast-color"
                        :style="{
                          backgroundColor: getUvColor(point.uvi),
                          color: getUvTextColor(point.uvi),
                          height: getUvBlockHeight(point.uvi),
                        }"
                        :title="forecastTooltip(point)"
                        role="img"
                        :aria-label="forecastTooltip(point)"
                      >
                        {{ point.uvi }}
                      </div>
                    </div>
                    <div class="hourly-forecast-time">{{ point.time }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="d-grid">
              <RouterLink to="/sunscreen" class="btn btn-success">
                View Sunscreen Guide →
              </RouterLink>
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

<style scoped>
.hourly-forecast-row {
  display: flex;
  gap: 3px;
  overflow-x: auto;
  padding-bottom: 4px;
  width: 100%;
}

.hourly-forecast-item {
  min-width: 30px;
  flex: 1 1 30px;
  text-align: center;
}

.hourly-forecast-bar-slot {
  display: flex;
  align-items: flex-end;
}

.hourly-forecast-color {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 13px;
  font-weight: 700;
}

.hourly-forecast-time {
  margin-top: 5px;
  font-size: 12px;
  color: #6c757d;
}
</style>
