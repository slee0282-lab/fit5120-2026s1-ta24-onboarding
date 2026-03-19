import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UVIndexView from '../views/UVIndexView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/uv-index',
      name: 'uv-index',
      component: UVIndexView,
    },
    {
      path: '/sunscreen',
      name: 'sunscreen',
      component: () => import('../views/SunscreenView.vue'),
    },
  ],
})

export default router
