<template>
  <div class="login-container">
    <div class="login-card">
      <h2>用户登录</h2>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="loginData.username" 
            required 
            placeholder="请输入用户名"
          >
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="loginData.password" 
            required 
            placeholder="请输入密码"
          >
        </div>
        
        <div class="form-actions">
          <button type="submit" class="login-button" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
        
        <div class="form-links">
          <router-link to="/register">没有账号？立即注册</router-link>
        </div>
      </form>
      
      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'Login',
  setup() {
    return {
      store: inject('store'),
      router: useRouter()
    };
  },
  data() {
    return {
      loginData: {
        username: '',
        password: ''
      },
      loading: false,
      errorMessage: ''
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        await this.store.dispatch('login', this.loginData);
        
        // 登录成功后跳转到首页
        this.router.push('/home');
        
        // 显示登录成功提示
        this.showSuccessMessage('登录成功！');
      } catch (error) {
        // 处理登录失败
        this.errorMessage = error.message || '登录失败，请检查用户名和密码';
        console.error('登录失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    showSuccessMessage(message) {
      // 可以添加一个全局的消息提示组件
      alert(message);
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f5f5;
  padding: 2rem;
}

.login-card {
  background-color: white;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #646cff;
}

.form-actions {
  margin-bottom: 1.5rem;
}

.login-button {
  width: 100%;
  padding: 0.9rem;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover:not(:disabled) {
  background-color: #535bf2;
}

.login-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.form-links {
  text-align: center;
}

.form-links a {
  color: #646cff;
  text-decoration: none;
  transition: color 0.3s;
}

.form-links a:hover {
  color: #535bf2;
  text-decoration: underline;
}

.error-message {
  background-color: #fadbd8;
  color: #c0392b;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}
</style>