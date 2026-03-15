<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import PasswordGate from './components/PasswordGate.vue'

const authenticated = ref(sessionStorage.getItem('authenticated') === 'true')
</script>

<template>
  <PasswordGate v-if="!authenticated" @authenticated="authenticated = true" />

  <template v-else>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <RouterLink class="navbar-brand fw-bold" to="/">SunSafe Victoria</RouterLink>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <RouterLink class="nav-link" to="/">UV Index</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/sunscreen">Sunscreen Guide</RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <RouterView />
  </template>
</template>

<style scoped>
.router-link-exact-active {
  color: #fff !important;
  font-weight: 600;
}
</style>
