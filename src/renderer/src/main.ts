import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

const router = createRouter({
  history: createWebHashHistory(),
  routes: []
})
app.use(router)

app.mount('#app')
