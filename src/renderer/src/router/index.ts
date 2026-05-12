import { createRouter, createWebHashHistory } from 'vue-router'
import Workspace from '../views/Workspace.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'workspace', component: Workspace }
  ]
})

export default router
