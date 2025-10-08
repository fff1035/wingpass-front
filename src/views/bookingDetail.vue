<template>
  <div class="booking-detail-container">
    <div class="header">
      <h1>预订详情</h1>
      <button class="back-button" @click="goBack">返回</button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载预订信息中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchBookingDetail" class="retry-button">重试</button>
    </div>
    
    <div v-else-if="bookingDetail" class="booking-content">
      <div class="booking-header">
        <div class="booking-info">
          <h2>航班信息</h2>
          <div class="flight-route">
            <div class="airport-info">
              <div class="airport-code">{{ bookingDetail.fromAirport }}</div>
              <div class="airport-name">{{ getAirportName(bookingDetail.fromAirport) }}</div>
            </div>
            <div class="route-line">
              <div class="line"></div>
              <div class="airplane-icon">✈</div>
            </div>
            <div class="airport-info">
              <div class="airport-code">{{ bookingDetail.toAirport }}</div>
              <div class="airport-name">{{ getAirportName(bookingDetail.toAirport) }}</div>
            </div>
          </div>
        </div>
        
        <div class="booking-meta">
          <div class="meta-item">
            <span class="label">航班号:</span>
            <span class="value">{{ bookingDetail.flightNumber }}</span>
          </div>
          <div class="meta-item">
            <span class="label">PNR号:</span>
            <span class="value">{{ bookingDetail.pnr }}</span>
          </div>
          <div class="meta-item">
            <span class="label">预订状态:</span>
            <span class="value status-{{ bookingDetail.status }}">{{ getStatusText(bookingDetail.status) }}</span>
          </div>
        </div>
      </div>
      
      <div class="booking-details">
        <div class="detail-section">
          <h3>行程信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">出发日期:</span>
              <span class="value">{{ formatDate(bookingDetail.departureDate) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">出发时间:</span>
              <span class="value">{{ bookingDetail.departureTime }}</span>
            </div>
            <div class="detail-item">
              <span class="label">到达日期:</span>
              <span class="value">{{ formatDate(bookingDetail.arrivalDate) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">到达时间:</span>
              <span class="value">{{ bookingDetail.arrivalTime }}</span>
            </div>
            <div class="detail-item">
              <span class="label">飞行时长:</span>
              <span class="value">{{ bookingDetail.flightDuration }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>旅客信息</h3>
          <div v-for="(passenger, index) in bookingDetail.passengers" :key="index" class="passenger-info">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">姓名:</span>
                <span class="value">{{ passenger.name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">证件类型:</span>
                <span class="value">{{ passenger.idType }}</span>
              </div>
              <div class="detail-item">
                <span class="label">证件号码:</span>
                <span class="value">{{ maskPassengerId(passenger.idNumber) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">票价:</span>
                <span class="value">¥{{ passenger.price }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>价格信息</h3>
          <div class="price-details">
            <div class="price-item">
              <span class="label">机票总价:</span>
              <span class="value">¥{{ bookingDetail.basePrice }}</span>
            </div>
            <div class="price-item">
              <span class="label">税费:</span>
              <span class="value">¥{{ bookingDetail.taxes }}</span>
            </div>
            <div class="price-item total">
              <span class="label">应付总额:</span>
              <span class="value">¥{{ bookingDetail.totalAmount }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="action-buttons">
        <button v-if="canRefund" @click="handleRefund" class="refund-button">申请退票</button>
        <button v-if="canReschedule" @click="handleReschedule" class="reschedule-button">申请改签</button>
        <button v-if="canCancel" @click="handleCancel" class="cancel-button">取消预订</button>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>未找到预订信息</p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default defineComponent({
  name: 'BookingDetail',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    const bookingId = route.params.id;
    const pnr = route.query.pnr;
    
    const state = {
      bookingDetail: null,
      loading: true,
      error: null
    };
    
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
    
    const fetchBookingDetail = async () => {
      state.loading = true;
      state.error = null;
      
      try {
        let booking;
        if (bookingId) {
          booking = await store.dispatch('getBookingById', bookingId);
        } else if (pnr) {
          booking = await store.dispatch('getBookingByPnr', pnr);
        } else {
          throw new Error('未提供预订ID或PNR号');
        }
        
        // 确保数据结构完整
        state.bookingDetail = {
          id: booking.bookingId || booking.id || bookingId,
          flightNumber: booking.flightNumber || '未知航班',
          fromAirport: booking.from || 'PEK',
          toAirport: booking.to || 'SHA',
          departureDate: booking.date || new Date().toISOString().split('T')[0],
          departureTime: booking.time || '12:00',
          arrivalDate: booking.arrivalDate || new Date().toISOString().split('T')[0],
          arrivalTime: booking.arrivalTime || '14:30',
          flightDuration: booking.duration || '2小时30分钟',
          pnr: booking.pnr || pnr || '未知PNR',
          status: booking.status || 'booked',
          passengers: booking.passengers || [{
            name: booking.passengerName || '旅客',
            idType: '身份证',
            idNumber: booking.passengerId || '110101199001011234',
            price: booking.price || booking.totalAmount || 1000
          }],
          basePrice: booking.basePrice || booking.totalAmount || 1000,
          taxes: booking.taxes || 200,
          totalAmount: booking.totalAmount || booking.price || 1200,
          ticketNo: booking.ticketNo || '未知票号'
        };
      } catch (error) {
        state.error = error.message || '获取预订详情失败';
        console.error('获取预订详情错误:', error);
      } finally {
        state.loading = false;
      }
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
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };
    
    const maskPassengerId = (idNumber) => {
      if (!idNumber) return '';
      return idNumber.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
    };
    
    const handleRefund = () => {
      router.push({ name: 'refund', query: { bookingId: state.bookingDetail.id } });
    };
    
    const handleReschedule = () => {
      router.push({ name: 'reschedule', query: { bookingId: state.bookingDetail.id } });
    };
    
    const handleCancel = async () => {
      if (confirm('确定要取消此预订吗？取消后可能无法恢复。')) {
        try {
          await store.dispatch('updateBookingStatus', { id: state.bookingDetail.id, status: 'cancelled' });
          alert('预订已成功取消');
          fetchBookingDetail();
        } catch (error) {
          alert('取消预订失败: ' + (error.message || '未知错误'));
        }
      }
    };
    
    const goBack = () => {
      router.go(-1);
    };
    
    // 计算按钮是否可点击的属性
    const canRefund = () => {
      const status = state.bookingDetail?.status?.toLowerCase() || '';
      return ['booked', 'paid', 'confirmed'].includes(status);
    };
    
    const canReschedule = () => {
      const status = state.bookingDetail?.status?.toLowerCase() || '';
      return ['booked', 'paid', 'confirmed'].includes(status);
    };
    
    const canCancel = () => {
      const status = state.bookingDetail?.status?.toLowerCase() || '';
      return ['booked', 'paid', 'confirmed'].includes(status);
    };
    
    // 初始加载数据
    fetchBookingDetail();
    
    return {
      ...state,
      bookingId,
      pnr,
      fetchBookingDetail,
      getAirportName,
      getStatusText,
      formatDate,
      maskPassengerId,
      handleRefund,
      handleReschedule,
      handleCancel,
      goBack,
      canRefund,
      canReschedule,
      canCancel
    };
  }
});
</script>

<style scoped>
.booking-detail-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
}

.back-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.back-button:hover {
  background-color: #2980b9;
}

.loading-container, .error-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #e74c3c;
  margin-bottom: 15px;
}

.retry-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #c0392b;
}

.booking-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.booking-header {
  margin-bottom: 30px;
}

.booking-info h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.flight-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
}

.airport-info {
  text-align: center;
  flex: 1;
}

.airport-code {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
}

.airport-name {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 5px;
}

.route-line {
  flex: 2;
  position: relative;
  text-align: center;
}

.line {
  height: 2px;
  background: #bdc3c7;
  margin: 0 20px;
}

.airplane-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 0 10px;
  font-size: 20px;
}

.booking-meta {
  display: flex;
  gap: 30px;
  margin-top: 30px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-size: 14px;
  color: #7f8c8d;
}

.value {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 500;
}

.status-booked, .status-paid, .status-confirmed {
  color: #27ae60;
}

.status-cancelled, .status-refunded {
  color: #e74c3c;
}

.status-delayed, .status-rescheduled {
  color: #f39c12;
}

.booking-details {
  margin-bottom: 30px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 18px;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.passenger-info {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.price-details {
  border-top: 1px solid #ecf0f1;
  padding-top: 15px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ecf0f1;
}

.price-item.total {
  font-weight: bold;
  color: #2c3e50;
  border-bottom: none;
  padding-top: 15px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.refund-button, .reschedule-button, .cancel-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.refund-button {
  background-color: #e74c3c;
  color: white;
}

.refund-button:hover {
  background-color: #c0392b;
}

.reschedule-button {
  background-color: #f39c12;
  color: white;
}

.reschedule-button:hover {
  background-color: #e67e22;
}

.cancel-button {
  background-color: #7f8c8d;
  color: white;
}

.cancel-button:hover {
  background-color: #6c757d;
}

@media (max-width: 768px) {
  .booking-meta {
    flex-direction: column;
    gap: 15px;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .flight-route {
    flex-direction: column;
    gap: 20px;
  }
  
  .route-line {
    transform: rotate(90deg);
    width: 80px;
  }
}
</style>