<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import PasswordGate from './components/PasswordGate.vue'
import logo from './assets/logo.png'

const authenticated = ref(sessionStorage.getItem('authenticated') === 'true')
const route = useRoute()
const isCompactFooterRoute = computed(() => route.path === '/uv-index' || route.path === '/sunscreen')
</script>

<template>
  <PasswordGate v-if="!authenticated" @authenticated="authenticated = true" />

  <template v-else>
    <div class="app-shell d-flex flex-column min-vh-100">
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div class="container">
          <RouterLink class="navbar-brand fw-bold d-inline-flex align-items-center" to="/">
            <img :src="logo" alt="SunSafe Victoria logo" class="brand-logo me-2" />
            <span>SunSafe Victoria</span>
          </RouterLink>
          <button
            class="navbar-toggler"x``
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
                <RouterLink class="nav-link" to="/">Home</RouterLink>
              </li>
              <li class="nav-item">
                <RouterLink class="nav-link" to="/uv-index">UV Index</RouterLink>
              </li>
              <li class="nav-item">
                <RouterLink class="nav-link" to="/sunscreen">Sunscreen Guide</RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div class="flex-grow-1">
        <RouterView />
      </div>

      <footer class="app-footer bg-dark py-4 mt-3">
        <div class="container" :class="isCompactFooterRoute ? 'footer-content-compact' : 'text-center'">
          <img
            :src="logo"
            alt="SunSafe Victoria logo"
            class="footer-logo"
            :class="{ 'footer-logo--compact': isCompactFooterRoute }"
          />
          <p class="footer-flavor-text mb-0" :class="{ 'mt-3': !isCompactFooterRoute }">
            Dedicated to keeping you sun-safe since 2026
          </p>
        </div>
      </footer>
    </div>
  </template>
</template>

<style scoped>
.router-link-exact-active {
  color: #fff !important;
  font-weight: 600;
}

.brand-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.footer-logo {
  width: min(320px, 80vw);
  height: auto;
}

.footer-logo--compact {
  width: 76px;
  height: 76px;
  object-fit: contain;
}

.footer-content-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.footer-flavor-text {
  color: #6c757d;
  font-size: 0.95rem;
  font-weight: 500;
}
</style>
