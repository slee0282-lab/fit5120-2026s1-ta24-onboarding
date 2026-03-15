<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ authenticated: [] }>()

const input = ref('')
const error = ref(false)

function submit() {
  if (input.value === import.meta.env.VITE_PASSWORD) {
    sessionStorage.setItem('authenticated', 'true')
    emit('authenticated')
  } else {
    error.value = true
    input.value = ''
  }
}
</script>

<template>
  <div class="gate-overlay d-flex align-items-center justify-content-center">
    <div class="card shadow p-4" style="max-width: 360px; width: 100%;">
      <h5 class="card-title text-center mb-1 fw-bold">SunSafe Victoria</h5>
      <p class="text-center text-muted small mb-4">Please enter the access password to continue.</p>
      <form @submit.prevent="submit">
        <div class="mb-3">
          <input
            v-model="input"
            type="password"
            class="form-control"
            :class="{ 'is-invalid': error }"
            placeholder="Password"
            autofocus
          />
          <div v-if="error" class="invalid-feedback">Incorrect password. Please try again.</div>
        </div>
        <button type="submit" class="btn btn-dark w-100">Enter</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.gate-overlay {
  position: fixed;
  inset: 0;
  background: #f8f9fa;
  z-index: 9999;
}
</style>
