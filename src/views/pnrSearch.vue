<template>
  <div class="pnr-search">
    <h2>PNR查询</h2>
    
    <div class="search-container">
      <form @submit.prevent="searchByPnr" class="search-form">
        <div class="form-group">
          <label for="pnr">预订参考号 (PNR)</label>
          <input 
            type="text" 
            id="pnr" 
            v-model="pnr" 
            required 
            placeholder="请输入您的PNR号码"
            maxlength="6"
            pattern="[A-Z0-9]{6}"
            title="PNR号码通常为6位字母或数字组合"
          >
        </div>
        <button type="submit" class="search-button" :disabled="loading">
          {{ loading ? '查询中...' : '查询' }}
        </button>
      </form>
    </div>
    
    <!-- 查询结果 -->
    <div class="result-container" v-if="bookingDetails">
      <h3>预订详情</h3>
      <div class="booking-details">
        <div class="detail-row">
          <span class="label">PNR号码:</span>
          <span class="value">{{ bookingDetails.pnr }}</span>
        </div>
        <div class="detail-row">
          <span class="label">预订状态:</span>
          <span class="value" :class="getStatusClass(bookingDetails.status)">
            {{ getStatusText(bookingDetails.status) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">航班号:</span>
          <span class="value">{{ bookingDetails.flightNumber || '未知' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">航线:</span>
          <span class="value">
            {{ airportMap[bookingDetails.from] || bookingDetails.from }} → 
            {{ airportMap[bookingDetails.to] || bookingDetails.to }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">出发日期:</span>
          <span class="value">{{ formatDate(bookingDetails.date) }} {{ bookingDetails.time || '未知' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">票价:</span>
          <span class="value">¥{{ bookingDetails.totalAmount || '未知' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">乘机人:</span>
          <span class="value">{{ bookingDetails.passengerName || '未知' }}</span>
        </div>
        <div class="detail-row" v-if="bookingDetails.ticketNo">
          <span class="label">票号:</span>
          <span class="value">{{ bookingDetails.ticketNo }}</span>
        </div>
        <div class="detail-row" v-if="bookingDetails.deadlinePickupAt">
          <span class="label">出票截止:</span>
          <span class="value">{{ formatDateTime(bookingDetails.deadlinePickupAt) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">预订时间:</span>
          <span class="value">{{ formatDateTime(bookingDetails.createdAt) }}</span>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons" v-if="canPerformActions">
        <router-link :to="{ name: 'refund', params: { bookingId: bookingDetails.id } }" class="action-button refund">
          申请退票
        </router-link>
        <router-link :to="{ name: 'reschedule', params: { bookingId: bookingDetails.id } }" class="action-button reschedule">
          申请改签
        </router-link>
      </div>
    </div>
    
    <!-- 无结果提示 -->
    <div class="no-result" v-if="showNoResult">
      <p>未找到与该PNR号码相关的预订信息</p>
      <p>请检查PNR号码是否正确，或联系客服获取帮助</p>
    </div>
    
    <!-- 错误提示 -->
    <div class="error-message" v-if="errorMessage">
      <p>{{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="close-button">关闭</button>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  name: 'PNRSearch',
  setup() {
    return {
      store: inject('store')
    };
  },
  data() {
    return {
      pnr: '',
      bookingDetails: null,
      loading: false,
      errorMessage: '',
      showNoResult: false,
      // 机场代码到机场名称的映射表
      airportMap: {
        'PEK': '北京首都国际机场',
        'SHA': '上海虹桥国际机场',
        'CAN': '广州白云国际机场',
        'SZX': '深圳宝安国际机场',
        'CTU': '成都双流国际机场',
        'KMG': '昆明长水国际机场',
        'HGH': '杭州萧山国际机场',
        'XIY': '西安咸阳国际机场',
        'NKG': '南京禄口国际机场',
        'TSN': '天津滨海国际机场'
      }
    };
  },
  computed: {
    canPerformActions() {
      // 只有已出票且未起飞的航班才能执行退票或改签操作
      return this.bookingDetails && 
             this.bookingDetails.status === 'TICKETED' && 
             !this.isFlightDeparted(this.bookingDetails.date, this.bookingDetails.time);
    }
  },
  methods: {
    async searchByPnr() {
      if (!this.pnr || this.pnr.trim().length === 0) {
        this.errorMessage = '请输入PNR号码';
        return;
      }
      
      this.loading = true;
      this.bookingDetails = null;
      this.showNoResult = false;
      this.errorMessage = '';
      
      try {
        const result = await this.store.dispatch('getBookingByPnr', this.pnr.trim());
        
        if (result) {
          // 补充航班信息和乘客信息
          this.bookingDetails = {
            ...result,
            flightNumber: result.flightId ? `CA${result.flightId.toString().padStart(4, '0')}` : '未知',
            from: 'PEK', // 默认值，实际应用中应该从航班信息中获取
            to: 'SHA', // 默认值，实际应用中应该从航班信息中获取
            passengerName: '旅客' + result.id,
            date: result.deadlinePickupAt ? result.deadlinePickupAt.split('T')[0] : new Date().toISOString().split('T')[0],
            time: '12:00' // 默认值
          };
        } else {
          this.showNoResult = true;
        }
      } catch (error) {
        console.error('PNR查询失败:', error);
        this.errorMessage = '查询失败，请稍后重试';
      } finally {
        this.loading = false;
      }
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'TICKETED': '已出票',
        'BOOKED': '已预订',
        'REFUNDED': '已退票',
        'RESCHEDULED': '已改签',
        'CANCELLED': '已取消'
      };
      return statusMap[status] || status;
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const classMap = {
        'TICKETED': 'status-ticketed',
        'BOOKED': 'status-booked',
        'REFUNDED': 'status-refunded',
        'RESCHEDULED': 'status-rescheduled',
        'CANCELLED': 'status-cancelled'
      };
      return classMap[status] || '';
    },
    
    // 判断航班是否已起飞
    isFlightDeparted(date, time) {
      if (!date) return false;
      const flightDateTime = new Date(`${date} ${time || '00:00'}`);
      const now = new Date();
      return flightDateTime < now;
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },
    
    // 格式化日期时间
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '';
      const date = new Date(dateTimeString);
      return date.toLocaleString('zh-CN');
    }
  }
};
</script>

<style scoped>
.pnr-search {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.search-container {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  width: 100%;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
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

.search-button {
  background-color: #646cff;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  align-self: flex-start;
}

.search-button:hover:not(:disabled) {
  background-color: #535bf2;
}

.search-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.result-container {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.booking-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 120px;
}

.value {
  color: #333;
  flex: 1;
}

.value.status-ticketed {
  color: #4caf50;
}

.value.status-booked {
  color: #2196f3;
}

.value.status-refunded {
  color: #ff9800;
}

.value.status-rescheduled {
  color: #9c27b0;
}

.value.status-cancelled {
  color: #f44336;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.action-button.refund {
  background-color: #ff9800;
  color: white;
}

.action-button.refund:hover {
  background-color: #e68900;
}

.action-button.reschedule {
  background-color: #2196f3;
  color: white;
}

.action-button.reschedule:hover {
  background-color: #1976d2;
}

.no-result, .error-message {
  text-align: center;
  padding: 3rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.no-result {
  background-color: #f9f9f9;
  color: #666;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.close-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.close-button:hover {
  background-color: #d32f2f;
}

@media (max-width: 600px) {
  .pnr-search {
    padding: 1rem;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .label {
    min-width: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
}
</style>