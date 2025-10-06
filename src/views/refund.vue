<template>
  <div class="refund">
    <h2>退票申请</h2>
    
    <div class="refund-policy">
      <h3>退票政策说明</h3>
      <ul>
        <li>航班起飞前24小时以上退票，收取票面价的10%作为手续费</li>
        <li>航班起飞前24小时内退票，收取票面价的20%作为手续费</li>
        <li>航班起飞后退票，收取票面价的50%作为手续费</li>
        <li>特殊情况（如重病、意外等）可提供相关证明申请全额退款</li>
      </ul>
    </div>
    
    <!-- 已预订机票列表 -->
    <div class="ticket-list" v-if="bookedTickets.length > 0">
      <h3>我的机票</h3>
      <div class="tickets-container">
        <div class="ticket-item" v-for="ticket in bookedTickets" :key="ticket.id">
          <div class="ticket-header">
            <span class="flight-number">{{ ticket.flightNumber }}</span>
            <span class="ticket-status">已预订</span>
          </div>
          
          <div class="ticket-info">
            <div class="route">
              <span class="city">{{ airportMap[ticket.from] || ticket.from }}</span>
              <span class="arrow">→</span>
              <span class="city">{{ airportMap[ticket.to] || ticket.to }}</span>
            </div>
            <div class="date-time">
              {{ ticket.date }} {{ ticket.time }}
            </div>
            <div class="passenger-info">
              <p>乘客: {{ ticket.passengerName }}</p>
              <p>身份证号: {{ maskPassengerId(ticket.passengerId) }}</p>
            </div>
            <div class="price-info">
              <p>票价: ¥{{ ticket.price }}</p>
              <p v-if="calculateRefundFee(ticket.date, ticket.time, ticket.price) !== null">
                预计退款金额: ¥{{ calculateRefundFee(ticket.date, ticket.time, ticket.price) }}
              </p>
              <p v-if="isFlightDeparted(ticket.date, ticket.time)">（已起飞）</p>
            </div>
          </div>
          
          <div class="ticket-actions">
            <button @click="applyRefund(ticket.id)" class="refund-button" :disabled="isFlightDeparted(ticket.date, ticket.time)">
              {{ isFlightDeparted(ticket.date, ticket.time) ? '航班已起飞' : '申请退票' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-tickets">
      <p>您目前没有可退票的机票</p>
    </div>
    
    <!-- 退款确认对话框 -->
    <div class="modal-overlay" v-if="showRefundModal" @click="closeRefundModal">
      <div class="modal-content" @click.stop>
        <h3>确认退票</h3>
        <div v-if="selectedTicket">
          <p>航班: {{ selectedTicket.flightNumber }}</p>
          <p>航线: {{ airportMap[selectedTicket.from] || selectedTicket.from }} → {{ airportMap[selectedTicket.to] || selectedTicket.to }}</p>
          <p>日期: {{ selectedTicket.date }} {{ selectedTicket.time }}</p>
          <p>乘客: {{ selectedTicket.passengerName }}</p>
          <p class="refund-amount">
            预计退款金额: ¥{{ calculateRefundFee(selectedTicket.date, selectedTicket.time, selectedTicket.price) }}
          </p>
          <p class="refund-note">
            确认退票后，退款将在1-7个工作日内原路返回您的支付账户。
          </p>
        </div>
        <div class="modal-actions">
          <button @click="closeRefundModal" class="cancel-button">取消</button>
          <button @click="confirmRefund" class="confirm-button">确认退票</button>
        </div>
      </div>
    </div>
    
    <!-- 退款成功提示 -->
    <div class="success-message" v-if="refundSuccess">
      <h3>退票申请已提交！</h3>
      <p>您的退票申请已成功提交，我们将尽快处理。</p>
      <router-link to="/" class="back-button">返回首页</router-link>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  name: "refund",
  setup() {
    return {
      store: inject('store')
    };
  },
  data() {
    return {
      bookedTickets: [],
      showRefundModal: false,
      selectedTicket: null,
      refundSuccess: false,
      loading: false,
      errorMessage: '',
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
    }
  },
  created() {
    if (this.store) {
      this.bookedTickets = this.store.getters.bookedTickets;
    }
  },
  watch: {
    // 监听bookedTickets变化，当store中的数据更新时，同步更新本地数据
    '$store.getters.bookedTickets': {
      handler(newTickets) {
        this.bookedTickets = newTickets;
      },
      immediate: true
    }
  },
  methods: {
    // 遮罩身份证号
    maskPassengerId(id) {
      if (!id) return '';
      return id.substring(0, 6) + '********' + id.substring(14);
    },
    
    // 判断航班是否已起飞
    isFlightDeparted(date, time) {
      const flightDateTime = new Date(`${date} ${time}`);
      const now = new Date();
      return flightDateTime < now;
    },
    
    // 计算退款金额
    calculateRefundFee(date, time, price) {
      const flightDateTime = new Date(`${date} ${time}`);
      const now = new Date();
      const timeDiff = flightDateTime - now;
      
      // 已起飞航班
      if (timeDiff < 0) {
        return Math.round(price * 0.5); // 50%退款
      }
      
      // 转换为小时
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff >= 24) {
        return Math.round(price * 0.9); // 起飞前24小时以上，90%退款
      } else {
        return Math.round(price * 0.8); // 起飞前24小时内，80%退款
      }
    },
    
    // 申请退票
    applyRefund(ticketId) {
      if (this.store) {
        this.selectedTicket = this.store.getters.getTicketById(ticketId);
        if (this.selectedTicket && !this.isFlightDeparted(this.selectedTicket.date, this.selectedTicket.time)) {
          this.showRefundModal = true;
        }
      }
    },
    
    // 关闭退款对话框
    closeRefundModal() {
      this.showRefundModal = false;
      this.selectedTicket = null;
    },
    
    // 确认退票
    async confirmRefund() {
      if (this.store && this.selectedTicket) {
        this.loading = true;
        this.errorMessage = '';
        
        try {
          // 根据后端API，退票实际上是更新预订状态为REFUNDED
          await this.store.dispatch('updateBookingStatus', {
            id: this.selectedTicket.id,
            status: 'REFUNDED'
          });
          
          this.closeRefundModal();
          
          // 显示成功信息
          this.refundSuccess = true;
          
          // 3秒后重置成功状态
          setTimeout(() => {
            this.refundSuccess = false;
          }, 3000);
        } catch (error) {
          this.errorMessage = '退票失败，请稍后重试';
          console.error('退票失败:', error);
        } finally {
          this.loading = false;
        }
      }
    }
  }
}
</script>

<style scoped>
.refund {
  max-width: 1000px;
  margin: 0 auto;
}

.refund-policy {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border-left: 4px solid #f39c12;
}

.refund-policy h3 {
  color: #f39c12;
  margin-bottom: 1rem;
}

.refund-policy ul {
  padding-left: 1.5rem;
  margin: 0;
}

.refund-policy li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.ticket-list {
  margin-bottom: 2rem;
}

.tickets-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.ticket-item {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: box-shadow 0.3s;
}

.ticket-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.flight-number {
  font-weight: bold;
  font-size: 1.2rem;
  color: #646cff;
}

.ticket-status {
  background-color: #4caf50;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.ticket-info {
  margin-bottom: 1.5rem;
}

.route {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0;
}

.city {
  font-size: 1.5rem;
  font-weight: bold;
}

.arrow {
  font-size: 1.5rem;
  color: #646cff;
}

.date-time {
  text-align: center;
  font-weight: 500;
  margin-bottom: 1rem;
}

.passenger-info,
.price-info {
  margin-bottom: 1rem;
}

.passenger-info p,
.price-info p {
  margin: 0.5rem 0;
  color: #333;
}

.refund-amount {
  font-weight: bold;
  color: #e74c3c;
}

.ticket-actions {
  text-align: center;
}

.refund-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.refund-button:hover:not(:disabled) {
  background-color: #c0392b;
}

.refund-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.no-tickets {
  text-align: center;
  padding: 3rem 0;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-content p {
  margin: 0.8rem 0;
}

.refund-note {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #7f8c8d;
}

.confirm-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.confirm-button:hover {
  background-color: #c0392b;
}

.success-message {
  text-align: center;
  background-color: #d5f4e6;
  padding: 3rem;
  border-radius: 8px;
  border: 1px solid #82e0aa;
}

.back-button {
  display: inline-block;
  background-color: #646cff;
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #535bf2;
}
</style>