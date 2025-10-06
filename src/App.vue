<template>
  <div class="app">
    <header class="header">
      <h1>WingPass - 航空票务系统</h1>
    </header>
    
    <nav class="nav">
      <ul>
        <li><router-link to="/">首页</router-link></li>
        <li><router-link to="/booking">机票预订</router-link></li>
        <li><router-link to="/refund">退票申请</router-link></li>
        <li><router-link to="/reschedule">机票改签</router-link></li>
      </ul>
    </nav>
    
    <main class="main">
      <router-view />
    </main>
    
    <footer class="footer">
      <p>&copy; 2024 WingPass 航空票务系统 - 为您提供便捷的机票预订服务</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      // 组件数据
    }
  }
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.header {
  background-color: #646cff;
  color: white;
  padding: 1rem 0;
  text-align: center;
}

.nav {
  background-color: #f0f0f0;
  padding: 1rem 0;
}

.nav ul {
  list-style: none;
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.nav a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav a:hover {
  background-color: #e0e0e0;
}

.main {
  flex: 1;
  padding: 2rem;
  background-color: #fff;
}

.footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 1rem 0;
  margin-top: auto;
}
</style>