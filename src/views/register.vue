<template>
  <div class="register-container">
    <div class="register-card">
      <h2>用户注册</h2>
      
      <!-- 注册类型选择 -->
      <div class="register-type-selection">
        <button 
          class="type-button" 
          :class="{ active: registerType === 'passenger' }"
          @click="setRegisterType('passenger')"
        >
          乘客注册
        </button>
        <button 
          class="type-button"
          :class="{ active: registerType === 'agency' }"
          @click="setRegisterType('agency')"
        >
          旅行社注册
        </button>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <!-- 通用字段 -->
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="registerData.username" 
            required 
            placeholder="请输入用户名"
          >
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="registerData.password" 
            required 
            placeholder="请输入密码"
          >
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="registerData.confirmPassword" 
            required 
            placeholder="请再次输入密码"
          >
        </div>
        
        <div class="form-group">
          <label for="email">电子邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="registerData.email" 
            required 
            placeholder="请输入电子邮箱"
          >
        </div>
        
        <div class="form-group">
          <label for="phone">联系电话</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="registerData.phone" 
            required 
            placeholder="请输入联系电话"
          >
        </div>
        
        <!-- 乘客特有字段 -->
        <div v-if="registerType === 'passenger'" class="form-group">
          <label for="fullName">姓名</label>
          <input 
            type="text" 
            id="fullName" 
            v-model="registerData.fullName" 
            required 
            placeholder="请输入姓名"
          >
        </div>
        
        <div v-if="registerType === 'passenger'" class="form-group">
          <label for="idCard">身份证号</label>
          <input 
            type="text" 
            id="idCard" 
            v-model="registerData.idCard" 
            required 
            placeholder="请输入身份证号"
          >
        </div>
        
        <!-- 旅行社特有字段 -->
        <div v-if="registerType === 'agency'" class="form-group">
          <label for="agencyName">旅行社名称</label>
          <input 
            type="text" 
            id="agencyName" 
            v-model="registerData.agencyName" 
            required 
            placeholder="请输入旅行社名称"
          >
        </div>
        
        <div v-if="registerType === 'agency'" class="form-group">
          <label for="licenseNumber">营业执照编号</label>
          <input 
            type="text" 
            id="licenseNumber" 
            v-model="registerData.licenseNumber" 
            required 
            placeholder="请输入营业执照编号"
          >
        </div>
        
        <div class="form-actions">
          <button type="submit" class="register-button" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </div>
        
        <div class="form-links">
          <router-link to="/login">已有账号？立即登录</router-link>
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
  name: 'Register',
  setup() {
    return {
      store: inject('store'),
      router: useRouter()
    };
  },
  data() {
    return {
      registerType: 'passenger', // 'passenger' 或 'agency'
      registerData: {
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        // 乘客字段
        fullName: '',
        idCard: '',
        // 旅行社字段
        agencyName: '',
        licenseNumber: ''
      },
      loading: false,
      errorMessage: ''
    };
  },
  methods: {
    setRegisterType(type) {
      this.registerType = type;
      this.errorMessage = '';
    },
    
    async handleRegister() {
      // 表单验证
      if (this.registerData.password !== this.registerData.confirmPassword) {
        this.errorMessage = '两次输入的密码不一致';
        return;
      }
      
      // 检查密码强度（至少8位，包含字母和数字）
      if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(this.registerData.password)) {
        this.errorMessage = '密码至少8位，必须包含字母和数字';
        return;
      }
      
      this.loading = true;
      this.errorMessage = '';
      
      try {
        // 构建注册数据
        const registrationData = {
          username: this.registerData.username,
          password: this.registerData.password,
          email: this.registerData.email,
          phone: this.registerData.phone
        };
        
        // 添加类型特定字段
        if (this.registerType === 'passenger') {
          Object.assign(registrationData, {
            fullName: this.registerData.fullName,
            idCard: this.registerData.idCard
          });
          
          // 调用乘客注册
          await this.store.dispatch('registerPassenger', registrationData);
          
          // 乘客注册成功后跳转到登录页
          this.router.push('/login');
          alert('乘客注册成功，请登录');
          return;
        } else {
          Object.assign(registrationData, {
            agencyName: this.registerData.agencyName,
            licenseNumber: this.registerData.licenseNumber
          });
          
          // 调用旅行社注册（需要管理员权限）
          await this.store.dispatch('registerAgency', registrationData);
          
          // 旅行社注册成功后跳转到登录页
          this.router.push('/login');
          alert('旅行社注册申请已提交，请使用管理员账户审批');
          return;
        }
      } catch (error) {
        // 处理注册失败
        this.errorMessage = error.message || '注册失败，请稍后重试';
        console.error('注册失败:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f5f5;
  padding: 2rem;
}

.register-card {
  background-color: white;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.register-card h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.register-type-selection {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.type-button {
  flex: 1;
  padding: 0.8rem;
  border: 2px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.type-button:hover {
  border-color: #646cff;
  color: #646cff;
}

.type-button.active {
  background-color: #646cff;
  border-color: #646cff;
  color: white;
}

.register-form {
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

.register-button {
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

.register-button:hover:not(:disabled) {
  background-color: #535bf2;
}

.register-button:disabled {
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