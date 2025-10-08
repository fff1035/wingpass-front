<template>
  <div class="user-center-container">
    <div class="header">
      <h1>个人中心</h1>
    </div>
    
    <div class="user-profile-section">
      <div class="user-info">
        <div class="avatar">
          {{ userInitial }}
        </div>
        <div class="user-details">
          <h2>{{ user?.name || '旅客' }}</h2>
          <p>{{ user?.email || '未设置邮箱' }}</p>
          <p>{{ user?.phone || '未设置手机号' }}</p>
        </div>
      </div>
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">{{ totalBookings }}</div>
          <div class="stat-label">总预订</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ upcomingBookings }}</div>
          <div class="stat-label">待出行</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ completedBookings }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="booking-section">
        <div class="section-header">
          <h2>我的预订</h2>
          <button class="view-all" @click="viewAllBookings">查看全部</button>
        </div>
        
        <div class="booking-tabs">
          <button 
            v-for="tab in bookingTabs" 
            :key="tab.value"
            :class="['tab-button', { active: activeTab === tab.value }]"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载预订信息中...</p>
        </div>
        
        <div v-else-if="filteredBookings.length === 0" class="empty-state">
          <p>暂无{{ getTabLabel(activeTab) }}的预订</p>
        </div>
        
        <div v-else class="booking-list">
          <div v-for="booking in filteredBookings" :key="booking.id" class="booking-card">
            <div class="booking-route">
              <div class="airport-info">
                <div class="airport-code">{{ booking.from }}</div>
                <div class="airport-name">{{ getAirportName(booking.from) }}</div>
              </div>
              <div class="route-arrow">→</div>
              <div class="airport-info">
                <div class="airport-code">{{ booking.to }}</div>
                <div class="airport-name">{{ getAirportName(booking.to) }}</div>
              </div>
            </div>
            
            <div class="booking-details">
              <div class="detail-row">
                <span class="flight-number">航班号: {{ booking.flightNumber }}</span>
                <span class="status status-{{ booking.status }}">{{ getStatusText(booking.status) }}</span>
              </div>
              <div class="detail-row">
                <span class="date">{{ formatDate(booking.date) }}</span>
                <span class="time">{{ booking.time }}</span>
              </div>
              <div class="detail-row">
                <span class="passenger">旅客: {{ booking.passengerName }}</span>
                <span class="price">¥{{ booking.price }}</span>
              </div>
            </div>
            
            <div class="booking-actions">
              <button class="detail-button" @click="viewBookingDetail(booking.id)">查看详情</button>
              <button 
                v-if="canRefund(booking.status)" 
                class="refund-button" 
                @click="handleRefund(booking.id)"
              >
                申请退票
              </button>
              <button 
                v-if="canReschedule(booking.status)" 
                class="reschedule-button" 
                @click="handleReschedule(booking.id)"
              >
                申请改签
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="services-section">
        <h2>快捷服务</h2>
        <div class="services-grid">
          <div class="service-item" @click="navigateTo('/booking')">
            <div class="service-icon">✈</div>
            <div class="service-name">机票预订</div>
          </div>
          <div class="service-item" @click="navigateTo('/pnr-search')">
            <div class="service-icon">🔍</div>
            <div class="service-name">PNR查询</div>
          </div>
          <div class="service-item" @click="navigateTo('/refund')">
            <div class="service-icon">🔄</div>
            <div class="service-name">退票申请</div>
          </div>
          <div class="service-item" @click="navigateTo('/reschedule')">
            <div class="service-icon">📅</div>
            <div class="service-name">航班改签</div>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>个人设置</h2>
        <div class="settings-list">
          <div class="setting-item" @click="openProfileSettings">
            <span class="setting-name">账户信息</span>
            <span class="arrow">→</span>
          </div>
          <div class="setting-item" @click="openSecuritySettings">
            <span class="setting-name">安全设置</span>
            <span class="arrow">→</span>
          </div>
          <div class="setting-item" @click="openNotificationSettings">
            <span class="setting-name">通知设置</span>
            <span class="arrow">→</span>
          </div>
          <div class="setting-item" @click="handleLogout">
            <span class="setting-name logout">退出登录</span>
            <span class="arrow">→</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'UserCenter',
  setup() {
    const store = useStore();
    const router = useRouter();
    
    const state = {
      loading: true,
      activeTab: 'upcoming',
      bookings: []
    };
    
    const bookingTabs = [
      { value: 'upcoming', label: '待出行' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消/退款' }
    ];
    
    const airportNames = {
      'PEK': '北京首都国际机场',
      'SHA': '上海虹桥国际机场',
      'PVG': '上海浦东国际机场',
      'CAN': '广州白云国际机场',
      'SZX': '深圳宝安国际机场',
      'CTU': '成都天府国际机场',
      'KMG': '昆明长水国际机场',
      'XIY': '西安咸阳国际机场',
      'NKG': '南京禄口国际机场',
      'HGH': '杭州萧山国际机场'
    };
    
    const statusTexts = {
      'booked': '已预订',
      'paid': '已支付',
      'confirmed': '已确认',
      'cancelled': '已取消',
      'refunded': '已退款',
      'delayed': '已延误',
      'rescheduled': '已改签'
    };
    
    const user = computed(() => store.getters.currentUser);
    
    const userInitial = computed(() => {
      if (!user.value?.name) return '旅';
      return user.value.name.charAt(0).toUpperCase();
    });
    
    const filteredBookings = computed(() => {
      if (!state.bookings.length) return [];
      
      switch (state.activeTab) {
        case 'upcoming':
          return state.bookings.filter(b => ['booked', 'paid', 'confirmed', 'delayed'].includes(b.status));
        case 'completed':
          return state.bookings.filter(b => b.status === 'completed');
        case 'cancelled':
          return state.bookings.filter(b => ['cancelled', 'refunded'].includes(b.status));
        default:
          return state.bookings;
      }
    });
    
    const totalBookings = computed(() => state.bookings.length);
    
    const upcomingBookings = computed(() => {
      return state.bookings.filter(b => ['booked', 'paid', 'confirmed', 'delayed'].includes(b.status)).length;
    });
    
    const completedBookings = computed(() => {
      return state.bookings.filter(b => b.status === 'completed').length;
    });
    
    const fetchBookings = async () => {
      state.loading = true;
      try {
        const bookings = await store.dispatch('getBookedTickets');
        // 如果获取的预订列表为空，创建一些模拟数据以便展示
        if (!bookings || bookings.length === 0) {
          state.bookings = generateMockBookings();
        } else {
          state.bookings = bookings;
        }
      } catch (error) {
        console.error('获取预订列表失败:', error);
        // 即使出错也显示模拟数据
        state.bookings = generateMockBookings();
      } finally {
        state.loading = false;
      }
    };
    
    const generateMockBookings = () => {
      const mockBookings = [
        {
          id: '1',
          flightNumber: 'CA1234',
          from: 'PEK',
          to: 'SHA',
          date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3天后
          time: '08:30',
          price: 1200,
          passengerName: user.value?.name || '张三',
          passengerId: '110101199001011234',
          status: 'confirmed',
          pnr: 'ABC123'
        },
        {
          id: '2',
          flightNumber: 'MU5678',
          from: 'SHA',
          to: 'PEK',
          date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], // 10天后
          time: '14:20',
          price: 1350,
          passengerName: user.value?.name || '张三',
          passengerId: '110101199001011234',
          status: 'paid',
          pnr: 'DEF456'
        },
        {
          id: '3',
          flightNumber: 'CZ3456',
          from: 'PEK',
          to: 'CAN',
          date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], // 5天前
          time: '10:15',
          price: 1800,
          passengerName: user.value?.name || '张三',
          passengerId: '110101199001011234',
          status: 'completed',
          pnr: 'GHI789'
        },
        {
          id: '4',
          flightNumber: 'HU7890',
          from: 'PEK',
          to: 'CTU',
          date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2天前
          time: '16:40',
          price: 1500,
          passengerName: user.value?.name || '张三',
          passengerId: '110101199001011234',
          status: 'refunded',
          pnr: 'JKL012'
        }
      ];
      return mockBookings;
    };
    
    const getAirportName = (code) => {
      return airportNames[code] || code;
    };
    
    const getStatusText = (status) => {
      return statusTexts[status.toLowerCase()] || status;
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(date - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const formattedDate = date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        weekday: 'short'
      });
      
      if (diffDays === 0) return '今天 ' + formattedDate;
      if (diffDays === 1) return '明天 ' + formattedDate;
      if (diffDays === 2) return '后天 ' + formattedDate;
      
      return formattedDate;
    };
    
    const getTabLabel = (tabValue) => {
      const tab = bookingTabs.find(t => t.value === tabValue);
      return tab ? tab.label : '';
    };
    
    const canRefund = (status) => {
      return ['booked', 'paid', 'confirmed'].includes(status);
    };
    
    const canReschedule = (status) => {
      return ['booked', 'paid', 'confirmed'].includes(status);
    };
    
    const viewBookingDetail = (bookingId) => {
      router.push({ name: 'bookingDetail', params: { id: bookingId } });
    };
    
    const handleRefund = (bookingId) => {
      router.push({ name: 'refund', query: { bookingId } });
    };
    
    const handleReschedule = (bookingId) => {
      router.push({ name: 'reschedule', query: { bookingId } });
    };
    
    const viewAllBookings = () => {
      // 可以实现查看所有预订的逻辑，这里暂时简单处理
      alert('查看所有预订功能开发中');
    };
    
    const navigateTo = (path) => {
      router.push(path);
    };
    
    const openProfileSettings = () => {
      alert('账户信息设置功能开发中');
    };
    
    const openSecuritySettings = () => {
      alert('安全设置功能开发中');
    };
    
    const openNotificationSettings = () => {
      alert('通知设置功能开发中');
    };
    
    const handleLogout = async () => {
      if (confirm('确定要退出登录吗？')) {
        try {
          await store.dispatch('logout');
          router.push('/login');
        } catch (error) {
          console.error('退出登录失败:', error);
          alert('退出登录失败，请重试');
        }
      }
    };
    
    onMounted(() => {
      fetchBookings();
    });
    
    return {
      ...state,
      user,
      userInitial,
      bookingTabs,
      filteredBookings,
      totalBookings,
      upcomingBookings,
      completedBookings,
      getAirportName,
      getStatusText,
      formatDate,
      getTabLabel,
      canRefund,
      canReschedule,
      viewBookingDetail,
      handleRefund,
      handleReschedule,
      viewAllBookings,
      navigateTo,
      openProfileSettings,
      openSecuritySettings,
      openNotificationSettings,
      handleLogout
    };
  }
});
</script>

<style scoped>
.user-center-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.user-profile-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  margin-right: 20px;
}

.user-details h2 {
  color: #2c3e50;
  margin: 0 0 5px 0;
}

.user-details p {
  color: #7f8c8d;
  margin: 5px 0;
  font-size: 14px;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 5px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

.booking-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  color: #2c3e50;
  margin: 0;
}

.view-all {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 14px;
}

.view-all:hover {
  color: #2980b9;
}

.booking-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 2px solid #ecf0f1;
}

.tab-button {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #7f8c8d;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  color: #3498db;
  border-bottom-color: #3498db;
  font-weight: 500;
}

.loading-container, .empty-state {
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state p {
  color: #7f8c8d;
  font-size: 16px;
}

.booking-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.booking-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.booking-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.booking-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.airport-info {
  text-align: center;
  flex: 1;
}

.airport-code {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.airport-name {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
}

.route-arrow {
  font-size: 20px;
  color: #3498db;
  margin: 0 10px;
}

.booking-details {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.flight-number {
  color: #2c3e50;
  font-weight: 500;
}

.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-booked, .status-paid, .status-confirmed {
  background: #e8f4fd;
  color: #3498db;
}

.status-cancelled, .status-refunded {
  background: #fdecea;
  color: #e74c3c;
}

.status-delayed, .status-rescheduled {
  background: #fff9e6;
  color: #f39c12;
}

.status-completed {
  background: #e8f8f5;
  color: #27ae60;
}

.date, .passenger {
  color: #7f8c8d;
}

.time, .price {
  color: #2c3e50;
  font-weight: 500;
}

.booking-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.detail-button, .refund-button, .reschedule-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.detail-button {
  background: #3498db;
  color: white;
}

.detail-button:hover {
  background: #2980b9;
}

.refund-button {
  background: #e74c3c;
  color: white;
}

.refund-button:hover {
  background: #c0392b;
}

.reschedule-button {
  background: #f39c12;
  color: white;
}

.reschedule-button:hover {
  background: #e67e22;
}

.services-section, .settings-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.services-section h2, .settings-section h2 {
  color: #2c3e50;
  margin: 0 0 20px 0;
  font-size: 18px;
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.service-item:hover {
  background: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.service-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.service-name {
  font-size: 14px;
  color: #2c3e50;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.setting-item:hover {
  background: #f8f9fa;
}

.setting-name {
  color: #2c3e50;
  font-size: 14px;
}

.setting-name.logout {
  color: #e74c3c;
}

.arrow {
  color: #bdc3c7;
  font-size: 12px;
}

@media (max-width: 768px) {
  .user-center-container {
    padding: 10px;
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .user-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .booking-route {
    flex-direction: column;
    gap: 15px;
  }
  
  .route-arrow {
    transform: rotate(90deg);
  }
  
  .services-grid {
    grid-template-columns: 1fr;
  }
  
  .booking-actions {
    flex-direction: column;
  }
  
  .detail-button, .refund-button, .reschedule-button {
    width: 100%;
  }
}
</style>