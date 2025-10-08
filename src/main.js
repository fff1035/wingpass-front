import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import store from './store'

// 创建应用实例并赋值给全局变量
const app = createApp(App).use(router).use(store)
window.app = app

// 初始化数据
app.mount('#app')
store.dispatch('initializeData')
