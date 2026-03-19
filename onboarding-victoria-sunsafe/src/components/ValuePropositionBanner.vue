<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="value-proposition-banner">
    <div class="banner-content">
      <h1 class="banner-title">SunSafe Victoria</h1>
      <p class="banner-subtitle">
        Protect your skin from the invisible dangers of UV. Get real-time UV index forecasts 
        and expert sunscreen guidance for Victoria.
      </p>
      <RouterLink to="/uv-index" class="btn start-now-btn">Check UV Index</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.value-proposition-banner {
  background: linear-gradient(135deg, #c25903 0%, #e9ab47 25%, #fcd745 50%, #ebc443 75%, #e06b1d 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 60px 20px;
  margin-top: 14px;
  margin-bottom: 4px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
}

/* Sun graphic element */
.value-proposition-banner::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.banner-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
  max-width: 600px;
  margin: 0 auto;
}

.banner-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  letter-spacing: -0.5px;
}

.banner-subtitle {
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  font-weight: 500;
  opacity: 0.95;
}

.start-now-btn {
  margin-top: 1rem;
  font-weight: 600;
  font-size: 1.2rem;
  padding: 0.5rem 0.9rem;
  background: linear-gradient(135deg, #e09e23 0%, #e67137 50%, #df4a24 100%);
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #fff;
}

.start-now-btn:hover,
.start-now-btn:focus {
  background-position: 100% 50%;
  border-color: rgba(0, 0, 0, 0.15);
  color: #fff;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Responsive sizing */
@media (max-width: 768px) {
  .value-proposition-banner {
    padding: 40px 20px;
    margin-bottom: 12px;
  }

  .banner-title {
    font-size: 2rem;
  }

  .banner-subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 576px) {
  .value-proposition-banner {
    padding: 30px 15px;
    margin-bottom: 12px;
  }

  .banner-title {
    font-size: 1.75rem;
  }

  .banner-subtitle {
    font-size: 0.95rem;
  }
}
</style>
