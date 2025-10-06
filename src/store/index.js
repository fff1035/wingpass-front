// 简单的状态管理
import ticketAPI from '../api/ticket.js';
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
  }
};

const actions = {
  // 初始化数据
  async initializeData({ commit }) {
    try {
      // 从API获取已预订机票
      const ticketsResponse = await ticketAPI.getBookedTickets();
      commit('setTickets', ticketsResponse || []);
    } catch (error) {
      console.error('初始化数据失败:', error);
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
      const response = await ticketAPI.getBookingByPnr(pnr);
      return response;
    } catch (error) {
      console.error('根据PNR获取预订详情失败:', error);
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
  }
};

const getters = {
  bookedTickets: state => state.tickets.filter(t => t.status === 'booked'),
  refundedTickets: state => state.tickets.filter(t => t.status === 'refunded'),
  getTicketById: state => id => state.tickets.find(t => t.id === id),
  availableFlights: state => state.availableFlights
};

export default createStore({
  state,
  mutations,
  actions,
  getters
});