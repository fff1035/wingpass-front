import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import store from './store'

const app = createApp(App).use(router).provide('store', store)

// 初始化数据
app.mount('#app')
store.dispatch('initializeData')
