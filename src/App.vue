<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1>WingPass - 航空票务系统</h1>
        <div v-if="isLoggedIn" class="user-info">
          <span>欢迎，{{ userName }}</span>
          <button @click="logout" class="logout-btn">登出</button>
        </div>
      </div>
    </header>
    
    <nav class="nav">
      <ul>
        <li v-if="isLoggedIn && !isAdmin"><router-link to="/home">首页</router-link></li>
        <li v-if="isLoggedIn && !isAdmin"><router-link to="/booking">机票预订</router-link></li>
        <li v-if="isLoggedIn && !isAdmin"><router-link to="/refund">退票申请</router-link></li>
        <li v-if="isLoggedIn && !isAdmin"><router-link to="/reschedule">机票改签</router-link></li>
        <li v-if="isAdmin"><router-link to="/flight-management">航班管理</router-link></li>
        <li v-if="isAdmin"><router-link to="/agency-management">旅行社管理</router-link></li>
        <li v-if="isAgency"><router-link to="/flight-management">航班管理</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/login">登录</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/register">注册</router-link></li>
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
    }
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn || localStorage.getItem('authToken') !== null;
    },
    userName() {
      const userInfo = this.$store.state.userInfo || JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.username || '用户';
    },
    isAdmin() {
      return this.$store.getters.isAdmin || JSON.parse(localStorage.getItem('userInfo') || '{}').role === 'ADMIN';
    },
    isAgency() {
      return this.$store.getters.isAgency || JSON.parse(localStorage.getItem('userInfo') || '{}').role === 'AGENCY';
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('logout').then(() => {
        this.$router.push('/login');
      });
    }
  },
  mounted() {
    // 初始化检查用户登录状态
    this.$store.dispatch('checkLoginStatus');
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
  padding: 1rem 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.logout-btn:hover {
  background-color: #ff7875;
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