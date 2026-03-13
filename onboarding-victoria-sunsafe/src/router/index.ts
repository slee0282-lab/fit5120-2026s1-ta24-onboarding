import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/sunscreen',
      name: 'sunscreen',
      component: () => import('../views/SunscreenView.vue'),
    },
  ],
})

export default router
