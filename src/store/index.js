// 简单的状态管理
import ticketAPI from '../api/ticket.js';
import authAPI from '../api/auth.js';
import { createStore } from 'vuex';

// 模拟机场列表 - 用于store初始化
const mockAirports = [
  { name: '北京首都国际机场', municipality: '北京', iata_code: 'PEK' },
  { name: '上海浦东国际机场', municipality: '上海', iata_code: 'PVG' },
  { name: '上海虹桥国际机场', municipality: '上海', iata_code: 'SHA' },
  { name: '广州白云国际机场', municipality: '广州', iata_code: 'CAN' },
  { name: '深圳宝安国际机场', municipality: '深圳', iata_code: 'SZX' },
  { name: '成都天府国际机场', municipality: '成都', iata_code: 'TFU' }
];

const state = {
  tickets: [],
  // 用户认证相关状态
  isLoggedIn: false,
  userInfo: null,
  token: null,
  refreshToken: null,
  userRole: null,
  availableFlights: [
    {
      id: 'CA1234',
      from: 'PEK',
      to: 'SHA',
      date: '2024-05-15',
      time: '09:00',
      price: 1200,
      seatsAvailable: 15
    },
    {
      id: 'CA1235',
      from: 'PEK',
      to: 'SHA',
      date: '2024-05-15',
      time: '14:00',
      price: 1300,
      seatsAvailable: 8
    },
    {
      id: 'MU5137',
      from: 'SHA',
      to: 'CAN',
      date: '2024-05-15',
      time: '10:30',
      price: 980,
      seatsAvailable: 12
    },
    {
      id: 'CZ3143',
      from: 'CAN',
      to: 'PEK',
      date: '2024-05-15',
      time: '16:45',
      price: 1500,
      seatsAvailable: 5
    }
  ]
};

const mutations = {
  setTickets(state, tickets) {
    state.tickets = tickets;
  },
  addTicket(state, ticket) {
    state.tickets.push({
      ...ticket,
      id: Date.now().toString(),
      status: ticket.status || 'booked' // 使用传入的status或默认值
    });
  },
  updateTicket(state, updatedTicket) {
    const index = state.tickets.findIndex(t => t.id === updatedTicket.id);
    if (index !== -1) {
      state.tickets[index] = {
        ...state.tickets[index],
        ...updatedTicket
      };
    }
  },
  refundTicket(state, ticketId) {
    const index = state.tickets.findIndex(t => t.id === ticketId);
    if (index !== -1) {
      state.tickets[index].status = 'refunded';
    }
  },
  setFlights(state, flights) {
    state.availableFlights = flights;
  },
  
  // 用户认证相关mutations
  setLoginStatus(state, status) {
    state.isLoggedIn = status;
  },
  
  setUserInfo(state, userInfo) {
    state.userInfo = userInfo;
  },
  
  setToken(state, { token, refreshToken }) {
    state.token = token;
    state.refreshToken = refreshToken;
  },
  
  setUserRole(state, role) {
    state.userRole = role;
  },
  
  clearAuthData(state) {
    state.isLoggedIn = false;
    state.userInfo = null;
    state.token = null;
    state.refreshToken = null;
    state.userRole = null;
  }
};

const actions = {
  // 初始化数据
  async initializeData({ commit }) {
    try {
      // 从API获取已预订机票
      const ticketsResponse = await ticketAPI.getBookedTickets();
      commit('setTickets', ticketsResponse || []);
      // 初始化用户登录状态
      await this.dispatch('checkLoginStatus');
    } catch (error) {
      console.error('初始化数据失败:', error);
    }
  },
  
  // 检查用户登录状态
  async checkLoginStatus({ commit }) {
    try {
      const token = localStorage.getItem('authToken');
      const userInfo = localStorage.getItem('userInfo');
      
      if (token && userInfo) {
        commit('setLoginStatus', true);
        commit('setToken', { token });
        commit('setUserInfo', JSON.parse(userInfo));
        
        // 尝试获取最新用户信息
        try {
          const currentUser = await authAPI.getCurrentUser();
          commit('setUserInfo', currentUser);
          commit('setUserRole', currentUser.role);
          localStorage.setItem('userInfo', JSON.stringify(currentUser));
        } catch (error) {
          console.warn('获取最新用户信息失败，使用本地缓存:', error);
        }
      } else {
        commit('clearAuthData');
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      commit('clearAuthData');
    }
  },
  
  // 用户登录
  async login({ commit, dispatch }, loginData) {
    try {
      // 为前端测试添加模拟登录功能
      // 当用户名和密码不为空时，使用模拟数据
      if (loginData.username && loginData.password) {
        // 模拟登录成功响应
        const mockResponse = {
          accessToken: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now()
        };
        
        // 模拟用户信息 - 根据用户名决定角色
        const isAdmin = loginData.username.toLowerCase().includes('admin');
        const mockUserInfo = {
          id: 'user-' + Date.now(),
          username: loginData.username,
          role: isAdmin ? 'ADMIN' : 'PASSENGER',
          name: isAdmin ? '管理员' : '普通用户',
          email: `${loginData.username}@example.com`,
          phone: '13800138000'
        };
        
        // 保存token和用户信息到localStorage
        localStorage.setItem('authToken', mockResponse.accessToken);
        localStorage.setItem('refreshToken', mockResponse.refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(mockUserInfo));
        
        // 设置store中的状态
        commit('setLoginStatus', true);
        commit('setToken', {
          token: mockResponse.accessToken,
          refreshToken: mockResponse.refreshToken
        });
        commit('setUserInfo', mockUserInfo);
        commit('setUserRole', mockUserInfo.role);
        
        // 模拟初始化数据
        setTimeout(() => {
          dispatch('initializeData').catch(err => console.error('初始化数据失败:', err));
        }, 300);
        
        console.log('使用模拟数据登录成功:', mockUserInfo);
        return mockResponse;
      }
      
      // 正常情况下调用API
      const response = await authAPI.login(loginData);
      
      // 保存token和用户信息到localStorage
      localStorage.setItem('authToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // 设置store中的状态
      commit('setLoginStatus', true);
      commit('setToken', {
        token: response.accessToken,
        refreshToken: response.refreshToken
      });
      
      // 获取并设置用户信息
      const userInfo = await authAPI.getCurrentUser();
      commit('setUserInfo', userInfo);
      commit('setUserRole', userInfo.role);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      // 重新初始化数据
      await dispatch('initializeData');
      
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },
  
  // 用户登出
  async logout({ commit }) {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('后端登出失败，继续清除本地数据:', error);
    } finally {
      // 清除本地数据
      commit('clearAuthData');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
    }
  },
  
  // 乘客注册
  async registerPassenger({ dispatch }, passengerData) {
    try {
      const response = await authAPI.registerPassenger(passengerData);
      
      // 注册成功后自动登录
      if (passengerData.autoLogin !== false) {
        await dispatch('login', {
          username: passengerData.username,
          password: passengerData.password
        });
      }
      
      return response;
    } catch (error) {
      console.error('乘客注册失败:', error);
      throw error;
    }
  },
  
  // 旅行社注册
  async registerAgency(_, agencyData) {
    try {
      return await authAPI.registerAgency(agencyData);
    } catch (error) {
      console.error('旅行社注册失败:', error);
      throw error;
    }
  },

  // 预订机票
  async bookTicket({ commit, dispatch }, ticketData) {
    try {
      // 调用API预订机票
      const response = await ticketAPI.bookTicket(ticketData);
      commit('addTicket', response);
      // 重新加载航班数据
      await dispatch('initializeData');
      return response;
    } catch (error) {
      console.error('预订机票失败:', error);
      throw error;
    }
  },

  // 退票
  async refundTicket({ commit, dispatch }, ticketId) {
    try {
      // 调用API退票
      const response = await ticketAPI.refundTicket(ticketId);
      if (response.success) {
        commit('refundTicket', ticketId);
        // 重新加载航班数据
        await dispatch('initializeData');
      }
      return response;
    } catch (error) {
      console.error('退票失败:', error);
      throw error;
    }
  },

  // 获取航班列表
  async getFlights({ commit }, { from, to, date }) {
    try {
      // 调用API获取航班列表
      const response = await ticketAPI.getFlights({ from, to, date });
      commit('setFlights', response || []);
      return response || [];
    } catch (error) {
      console.error('获取航班列表失败:', error);
      // 返回模拟数据作为降级方案
      return [];
    }
  },

  // 搜索预订列表
  async searchBookings({ commit }, bookingDto) {
    try {
      const response = await ticketAPI.searchBookings(bookingDto);
      return response;
    } catch (error) {
      console.error('搜索预订列表失败:', error);
      throw error;
    }
  },

  // 根据ID获取预订详情
  async getBookingById({ commit }, bookingId) {
    try {
      const response = await ticketAPI.getBookingById(bookingId);
      return response;
    } catch (error) {
      console.error('获取预订详情失败:', error);
      throw error;
    }
  },

  // 根据PNR获取预订详情
  async getBookingByPnr({ commit }, pnr) {
    try {
      const booking = await ticketAPI.getBookingByPnr(pnr);
      return booking;
    } catch (error) {
      console.error('获取PNR信息失败:', error);
      throw error;
    }
  },

  // 更新预订状态
  async updateBookingStatus({ commit, dispatch }, { id, status }) {
    try {
      const response = await ticketAPI.updateBookingStatus(id, status);
      // 重新加载数据以更新视图
      await dispatch('initializeData');
      return response;
    } catch (error) {
      console.error('更新预订状态失败:', error);
      throw error;
    }
  },

  // 创建新的预订
  async createBooking({ commit, dispatch }, bookingData) {
    try {
      const response = await ticketAPI.createBooking(bookingData);
      // 重新加载数据以更新视图
      await dispatch('initializeData');
      return response;
    } catch (error) {
      console.error('创建预订失败:', error);
      throw error;
    }
  },

  // 创建退款请求
  async createRefund({ commit, dispatch }, refundRequest) {
    try {
      const response = await ticketAPI.createRefund(refundRequest);
      // 重新加载数据以更新视图
      await dispatch('initializeData');
      return response;
    } catch (error) {
      console.error('创建退款请求失败:', error);
      throw error;
    }
  },

  // 航班延误操作
  async delayFlight({ commit, dispatch }, delayRequest) {
    try {
      const response = await ticketAPI.delayFlight(delayRequest);
      // 重新加载数据以更新视图
      await dispatch('initializeData');
      return response;
    } catch (error) {
      console.error('航班延误操作失败:', error);
      throw error;
    }
  },

  // 航班取消操作
  async cancelFlight({ commit, dispatch }, cancelRequest) {
    try {
      const response = await ticketAPI.cancelFlight(cancelRequest);
      // 重新加载数据以更新视图
      await dispatch('initializeData');
      return response;
    } catch (error) {
      console.error('航班取消操作失败:', error);
      throw error;
    }
  }
};

const getters = {
  // 票务相关getters
  bookedTickets: state => state.tickets.filter(t => t.status === 'booked'),
  refundedTickets: state => state.tickets.filter(t => t.status === 'refunded'),
  getTicketById: state => id => state.tickets.find(t => t.id === id),
  availableFlights: state => state.availableFlights,
  
  // 用户认证相关getters
  isLoggedIn: state => state.isLoggedIn,
  userInfo: state => state.userInfo,
  userRole: state => state.userRole,
  isAdmin: state => state.userRole === 'ADMIN',
  isAgency: state => state.userRole === 'AGENCY',
  isPassenger: state => state.userRole === 'PASSENGER'
};

export default createStore({
  state,
  mutations,
  actions,
  getters
});