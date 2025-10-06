<template>
  <div class="reschedule">
    <h2>机票改签</h2>
    
    <div class="reschedule-policy">
      <h3>改签政策说明</h3>
      <ul>
        <li>航班起飞前24小时以上改签，收取票面价的5%作为手续费</li>
        <li>航班起飞前24小时内改签，收取票面价的10%作为手续费</li>
        <li>每张机票最多可改签2次</li>
        <li>改签后的航班价格高于原票价，需补差价；低于原票价，差价不退</li>
      </ul>
    </div>
    
    <!-- 已预订机票列表 -->
    <div class="ticket-list" v-if="!selectedTicket && bookedTickets.length > 0">
      <h3>选择要改签的机票</h3>
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
            </div>
            <div class="price-info">
              <p>票价: ¥{{ ticket.price }}</p>
              <p v-if="isFlightDeparted(ticket.date, ticket.time)">（已起飞）</p>
            </div>
          </div>
          
          <div class="ticket-actions">
            <button @click="selectTicketForReschedule(ticket)" class="select-button" :disabled="isFlightDeparted(ticket.date, ticket.time)">
              {{ isFlightDeparted(ticket.date, ticket.time) ? '航班已起飞' : '选择此票' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 改签航班查询 -->
    <div class="reschedule-search" v-if="selectedTicket">
      <h3>查询新航班</h3>
      <form @submit.prevent="searchNewFlights">
        <div class="form-group">
          <label for="newDate">新的出发日期</label>
          <input type="date" id="newDate" v-model="newFlightCriteria.date" required min="{{ today }}">
        </div>
        
        <button type="submit" class="search-button">查询航班</button>
      </form>
      
      <!-- 新航班列表 -->
      <div class="new-flights" v-if="newFlights.length > 0">
        <h4>可选航班</h4>
        <div class="flight-list">
          <div class="flight-item" v-for="flight in newFlights" :key="flight.id">
            <div class="flight-header">
              <span class="flight-number">{{ flight.id }}</span>
              <span class="price">¥{{ flight.price }}</span>
            </div>
            <div class="flight-info">
              <div class="route">
                <div class="city-time">
                  <span class="city">{{ airportMap[flight.from] || flight.from }}</span>
                  <span class="time">{{ flight.time }}</span>
                </div>
                <div class="duration">约2小时30分钟</div>
                <div class="city-time">
                  <span class="city">{{ airportMap[flight.to] || flight.to }}</span>
                  <span class="time">{{ calculateArrivalTime(flight.time) }}</span>
                </div>
              </div>
              <div class="seats">剩余座位: {{ flight.seatsAvailable }}</div>
              <button @click="selectNewFlight(flight)" class="select-button" :disabled="flight.seatsAvailable <= 0">
                {{ flight.seatsAvailable > 0 ? '选择此航班' : '座位已满' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <button @click="cancelReschedule" class="cancel-button">取消改签</button>
    </div>
    
    <!-- 改签确认对话框 -->
    <div class="modal-overlay" v-if="showConfirmModal" @click="closeConfirmModal">
      <div class="modal-content" @click.stop>
        <h3>确认改签</h3>
        <div v-if="selectedTicket && selectedNewFlight">
          <div class="ticket-comparison">
            <div class="original-ticket">
              <h4>原航班</h4>
              <p>{{ selectedTicket.flightNumber }} | {{ airportMap[selectedTicket.from] || selectedTicket.from }} → {{ airportMap[selectedTicket.to] || selectedTicket.to }}</p>
              <p>{{ selectedTicket.date }} {{ selectedTicket.time }}</p>
              <p>票价: ¥{{ selectedTicket.price }}</p>
            </div>
            
            <div class="arrow-down">↓</div>
            
            <div class="new-ticket">
              <h4>新航班</h4>
              <p>{{ selectedNewFlight.id }} | {{ airportMap[selectedNewFlight.from] || selectedNewFlight.from }} → {{ airportMap[selectedNewFlight.to] || selectedNewFlight.to }}</p>
              <p>{{ selectedNewFlight.date }} {{ selectedNewFlight.time }}</p>
              <p>票价: ¥{{ selectedNewFlight.price }}</p>
            </div>
          </div>
          
          <div class="fee-calculation">
            <p v-if="selectedNewFlight.price > selectedTicket.price">
              需要补差价: ¥{{ selectedNewFlight.price - selectedTicket.price }}
            </p>
            <p v-else>
              差价不退
            </p>
            <p>手续费: ¥{{ calculateRescheduleFee(selectedTicket.date, selectedTicket.time, selectedTicket.price) }}</p>
            <p class="total-amount">
              总计{{ selectedNewFlight.price > selectedTicket.price ? '需支付' : '应支付' }}: ¥{{ 
                selectedNewFlight.price > selectedTicket.price ? 
                (selectedNewFlight.price - selectedTicket.price + calculateRescheduleFee(selectedTicket.date, selectedTicket.time, selectedTicket.price)) : 
                calculateRescheduleFee(selectedTicket.date, selectedTicket.time, selectedTicket.price)
              }}
            </p>
          </div>
          
          <p class="reschedule-note">
            确认改签后，原机票将被取消，新机票将立即生效。
          </p>
        </div>
        <div class="modal-actions">
          <button @click="closeConfirmModal" class="cancel-button">取消</button>
          <button @click="confirmReschedule" class="confirm-button">确认改签</button>
        </div>
      </div>
    </div>
    
    <!-- 改签成功提示 -->
    <div class="success-message" v-if="rescheduleSuccess">
      <h3>改签成功！</h3>
      <p>您的机票已成功改签，新的航班信息已更新。</p>
      <router-link to="/" class="back-button">返回首页</router-link>
    </div>
    
    <div v-else-if="!selectedTicket && bookedTickets.length === 0" class="no-tickets">
      <p>您目前没有可改签的机票</p>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  name: 'Reschedule',
  setup() {
    return {
      store: inject('store')
    };
  },
  data() {
    return {
      bookedTickets: [],
      selectedTicket: null,
      newFlights: [],
      selectedNewFlight: null,
      newFlightCriteria: {
        date: ''
      },
      today: '',
      loading: false,
      errorMessage: '',
      showConfirmModal: false,
      rescheduleSuccess: false,
      // 机场代码到城市名称的映射表
      airportMap: {
        'PEK': '北京',
        'SHA': '上海',
        'CAN': '广州',
        'SZX': '深圳',
        'CTU': '成都',
        'KMG': '昆明',
        'HGH': '杭州',
        'XIY': '西安',
        'NKG': '南京',
        'TSN': '天津'
      }
    };
  },
  created() {
    if (this.store) {
      // 获取预订的机票
      this.bookedTickets = this.store.getters.bookedTickets;
    }
    // 设置今天的日期
    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    this.newFlightCriteria.date = this.today;
  },
  watch: {
    // 监听store中的bookedTickets变化
    '$store.getters.bookedTickets': {
      handler(newValue) {
        this.bookedTickets = newValue;
      },
      deep: true
    }
  },
  methods: {
    // 判断航班是否已起飞
    isFlightDeparted(date, time) {
      const flightDateTime = new Date(`${date} ${time}`);
      const now = new Date();
      return flightDateTime < now;
    },
    
    // 选择要改签的机票
    selectTicketForReschedule(ticket) {
      this.selectedTicket = ticket;
      // 设置新航班查询条件
      this.newFlightCriteria.date = this.today;
      // 清空之前的查询结果
      this.newFlights = [];
      this.selectedNewFlight = null;
    },
    
    // 查询新航班
    async searchNewFlights() {
      if (this.store && this.selectedTicket) {
        this.loading = true;
        this.errorMessage = '';
        
        try {
          this.newFlights = await this.store.dispatch('getFlights', {
            from: this.selectedTicket.from, // 这里已经是机场代码
            to: this.selectedTicket.to, // 这里已经是机场代码
            date: this.newFlightCriteria.date
          });
          
          if (this.newFlights.length === 0) {
            this.errorMessage = '没有找到符合条件的航班，请尝试其他日期';
          }
        } catch (error) {
          this.errorMessage = '搜索新航班失败，请稍后重试';
          console.error('搜索新航班失败:', error);
        } finally {
          this.loading = false;
        }
      }
    },
    
    // 选择新航班
    selectNewFlight(flight) {
      this.selectedNewFlight = flight;
      this.showConfirmModal = true;
    },
    
    // 计算到达时间
    calculateArrivalTime(departureTime) {
      // 简单计算到达时间（假设飞行时间为2小时30分钟）
      const [hours, minutes] = departureTime.split(':').map(Number);
      let arrivalHours = hours + 2;
      let arrivalMinutes = minutes + 30;
      
      if (arrivalMinutes >= 60) {
        arrivalHours += 1;
        arrivalMinutes -= 60;
      }
      
      if (arrivalHours >= 24) {
        arrivalHours -= 24;
      }
      
      return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
    },
    
    // 计算改签手续费
    calculateRescheduleFee(date, time, price) {
      const flightDateTime = new Date(`${date} ${time}`);
      const now = new Date();
      const timeDiff = flightDateTime - now;
      
      // 转换为小时
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff >= 24) {
        return Math.round(price * 0.05); // 起飞前24小时以上，5%手续费
      } else {
        return Math.round(price * 0.1); // 起飞前24小时内，10%手续费
      }
    },
    
    // 关闭确认对话框
    closeConfirmModal() {
      this.showConfirmModal = false;
    },
    
    // 取消改签
    cancelReschedule() {
      this.selectedTicket = null;
      this.newFlights = [];
      this.selectedNewFlight = null;
      this.showConfirmModal = false;
    },
    
    // 确认改签
    async confirmReschedule() {
      if (this.store && this.selectedTicket && this.selectedNewFlight) {
        this.loading = true;
        this.errorMessage = '';
        
        try {
          // 根据后端API，改签实际上是更新预订状态为RESCHEDULED
          // 首先更新预订状态
          await this.store.dispatch('updateBookingStatus', {
            id: this.selectedTicket.id,
            status: 'RESCHEDULED'
          });
          
          // 然后创建新的预订
          const newBooking = {
            agencyId: 1, // 根据实际情况设置
            flightId: this.selectedNewFlight.id,
            totalAmount: this.selectedNewFlight.price,
            depositAmount: 0,
            deadlinePickupAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后
            passengers: [
              {
                passengerId: 3, // 根据实际情况设置
                seatNo: this.selectedTicket.seatNo || '12A'
              }
            ]
          };
          
          const bookingResponse = await this.store.dispatch('createBooking', newBooking);
          
          // 关闭对话框
          this.closeConfirmModal();
          
          // 重新获取预订列表以更新视图
          this.bookedTickets = this.store.getters.bookedTickets;
          
          // 显示成功信息
          this.rescheduleSuccess = true;
          // 3秒后重置成功状态
          setTimeout(() => {
            this.rescheduleSuccess = false;
          }, 3000);
        } catch (error) {
          this.errorMessage = '改签失败，请稍后重试';
          console.error('改签失败:', error);
        } finally {
          this.loading = false;
        }
      }
    }
  }
}
</script>

<style scoped>
.reschedule {
  max-width: 1000px;
  margin: 0 auto;
}

.reschedule-policy {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border-left: 4px solid #3498db;
}

.reschedule-policy h3 {
  color: #3498db;
  margin-bottom: 1rem;
}

.reschedule-policy ul {
  padding-left: 1.5rem;
  margin: 0;
}

.reschedule-policy li {
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

.ticket-actions {
  text-align: center;
}

.select-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.select-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.select-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.reschedule-search {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
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
}

.search-button:hover {
  background-color: #535bf2;
}

.new-flights {
  margin-top: 2rem;
}

.flight-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.flight-item {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: box-shadow 0.3s;
}

.flight-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.flight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.price {
  font-weight: bold;
  font-size: 1.2rem;
  color: #e74c3c;
}

.flight-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.city-time {
  text-align: center;
}

.city {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
}

.time {
  display: block;
  color: #666;
}

.duration {
  color: #666;
  font-size: 0.9rem;
}

.seats {
  color: #666;
  font-size: 0.9rem;
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #7f8c8d;
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
  max-width: 600px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.ticket-comparison {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.original-ticket,
.new-ticket {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
}

.original-ticket h4,
.new-ticket h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.arrow-down {
  text-align: center;
  font-size: 1.5rem;
  color: #646cff;
}

.fee-calculation {
  background-color: #e8f4fd;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.total-amount {
  font-weight: bold;
  color: #3498db;
}

.reschedule-note {
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

.confirm-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.confirm-button:hover {
  background-color: #2980b9;
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

.no-tickets {
  text-align: center;
  padding: 3rem 0;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
}
</style>