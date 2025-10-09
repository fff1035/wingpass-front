// 封装所有与认证相关的后端交互逻辑

// 后端服务地址，根据文档要求设置
const API_BASE_URL = 'http://localhost:8080/api';

// 创建axios实例
import axios from 'axios';
const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 响应拦截器
authClient.interceptors.response.use(
  response => {
    // 根据Result<T>响应格式处理
    if (response.data && response.data.code === '200') {
      return response.data.data;
    } else if (response.data) {
      // 处理非200响应码
      const error = new Error(response.data.message || '请求失败');
      error.code = response.data.code;
      error.response = response;
      return Promise.reject(error);
    }
    return response.data;
  },
  error => {
    // 统一错误处理
    console.error('认证请求错误:', error);
    if (error.response) {
      // 服务器返回错误状态码
      const errorData = error.response.data;
      const errorMessage = errorData?.message || '认证失败，请稍后重试';
      const errorCode = errorData?.code || error.response.status;
      
      const authError = new Error(errorMessage);
      authError.code = errorCode;
      authError.response = error.response;
      
      return Promise.reject(authError);
    } else if (error.request) {
      // 请求已发送但未收到响应
      const networkError = new Error('网络错误，请检查网络连接');
      networkError.code = 'NETWORK_ERROR';
      return Promise.reject(networkError);
    } else {
      // 请求配置出错
      const configError = new Error('请求配置错误');
      configError.code = 'CONFIG_ERROR';
      return Promise.reject(configError);
    }
  }
);

// 认证API方法集合
export const authAPI = {
  /**
   * 用户登录
   * @param {Object} loginData - 登录数据，包含username和password
   * @returns {Promise} 登录结果Promise，包含token信息
   */
  login: async (loginData) => {
    try {
      return await authClient.post('/login', loginData);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  /**
   * 刷新令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Promise} 新的令牌信息Promise
   */
  refresh: async (refreshToken) => {
    try {
      return await authClient.post('/refresh', { refreshToken });
    } catch (error) {
      console.error('刷新令牌失败:', error);
      throw error;
    }
  },

  /**
   * 乘客注册
   * @param {Object} passengerData - 乘客注册数据
   * @returns {Promise} 注册结果Promise
   */
  registerPassenger: async (passengerData) => {
    try {
      return await authClient.post('/register/passenger', passengerData);
    } catch (error) {
      console.error('乘客注册失败:', error);
      throw error;
    }
  },

  /**
   * 航空公司注册
   * @param {Object} agencyData - 航空公司注册数据
   * @returns {Promise} 注册结果Promise
   */
  registerAgency: async (agencyData) => {
    try {
      // 需要admin权限才能注册航空公司
      // 在实际使用中，需要先有admin登录的token
      const token = localStorage.getItem('authToken');
      if (token) {
        authClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return await authClient.post('/register/agency', agencyData);
    } catch (error) {
      console.error('航空公司注册失败:', error);
      throw error;
    }
  },

  /**
   * 用户登出
   * @returns {Promise} 登出结果Promise
   */
  logout: async () => {
    try {
      // 清除localStorage中的token
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      return await authClient.post('/logout');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使后端登出失败，也清除本地token
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      throw error;
    }
  },

  /**
   * 获取当前用户信息
   * @returns {Promise} 用户信息Promise
   */
  getCurrentUser: async () => {
    try {
      return await authClient.get('/me');
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  },

  /**
   * 保存认证信息到本地存储
   * @param {Object} authData - 认证数据，包含token和用户信息
   */
  saveAuthData: (authData) => {
    if (authData.accessToken) {
      localStorage.setItem('authToken', authData.accessToken);
    }
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }
    if (authData.userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(authData.userInfo));
    }
  },

  /**
   * 从本地存储清除认证信息
   */
  clearAuthData: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  },

  /**
   * 检查本地是否有有效认证信息
   * @returns {boolean} 是否有有效认证信息
   */
  hasAuthData: () => {
    return localStorage.getItem('authToken') !== null;
  },

  /**
   * 从本地存储获取认证信息
   * @returns {Object} 认证信息对象
   */
  getAuthData: () => {
    return {
      accessToken: localStorage.getItem('authToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null')
    };
  }
};

export default authAPI;