<template>
  <div class="booking">
    <h2>机票预订</h2>
    
    <!-- 航班查询表单 -->
    <div class="search-form">
      <h3>查询航班</h3>
      <form @submit.prevent="searchFlights">
        <!-- 机场映射表，包含主要城市的机场代码 -->
      <div v-if="false">
        <input v-model="airportMap" type="hidden">
      </div>
      
      <div class="form-group">
          <label for="from">出发城市</label>
          <select id="from" v-model="searchCriteria.from" required>
            <option value="PEK">北京</option>
            <option value="SHA">上海</option>
            <option value="CAN">广州</option>
            <option value="SZX">深圳</option>
            <option value="CTU">成都</option>
            <option value="HGH">杭州</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="to">到达城市</label>
          <select id="to" v-model="searchCriteria.to" required>
            <option value="PEK">北京</option>
            <option value="SHA">上海</option>
            <option value="CAN">广州</option>
            <option value="SZX">深圳</option>
            <option value="CTU">成都</option>
            <option value="HGH">杭州</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="date">出发日期</label>
          <input type="date" id="date" v-model="searchCriteria.date" required min="{{ today }}">
        </div>
        
        <button type="submit" class="search-button">查询航班</button>
      </form>
    </div>
    
    <!-- 航班列表 -->
    <div class="flight-results" v-if="flights.length > 0">
      <h3>航班列表</h3>
      <div class="flight-list">
        <div class="flight-item" v-for="flight in flights" :key="flight.id">
          <div class="flight-header">
            <span class="flight-number">{{ flight.id }}</span>
            <span class="price">¥{{ flight.price }}</span>
          </div>
          <div class="flight-info">
            <div class="route">
              <div class="city-time">
                <span class="city">{{ flight.from.includes(' ') ? flight.from : airportMap[flight.from] || flight.from }}</span>
                <span class="time">{{ flight.time }}</span>
              </div>
              <div class="duration">约2小时30分钟</div>
              <div class="city-time">
                <span class="city">{{ flight.to.includes(' ') ? flight.to : airportMap[flight.to] || flight.to }}</span>
                <span class="time">{{ calculateArrivalTime(flight.time) }}</span>
              </div>
            </div>
            <div class="seats">剩余座位: {{ flight.seatsAvailable }}</div>
            <button @click="selectFlight(flight)" class="book-button" :disabled="flight.seatsAvailable <= 0">
              {{ flight.seatsAvailable > 0 ? '选择此航班' : '座位已满' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 预订表单 -->
    <div class="booking-form" v-if="selectedFlight">
      <h3>填写预订信息</h3>
      <form @submit.prevent="submitBooking">
        <div class="flight-summary">
          <h4>航班信息</h4>
          <p>{{ selectedFlight.id }} | {{ selectedFlight.from.includes(' ') ? selectedFlight.from : airportMap[selectedFlight.from] || selectedFlight.from }} → {{ selectedFlight.to.includes(' ') ? selectedFlight.to : airportMap[selectedFlight.to] || selectedFlight.to }} | {{ selectedFlight.date }} {{ selectedFlight.time }}</p>
          <p>价格: ¥{{ selectedFlight.price }}</p>
        </div>
        
        <div class="form-group">
          <label for="passengerName">乘客姓名</label>
          <input type="text" id="passengerName" v-model="bookingInfo.passengerName" required placeholder="请输入乘客姓名">
        </div>
        
        <div class="form-group">
          <label for="passengerId">身份证号</label>
          <input type="text" id="passengerId" v-model="bookingInfo.passengerId" required placeholder="请输入18位身份证号">
        </div>
        
        <div class="form-group">
          <label for="contactPhone">联系电话</label>
          <input type="tel" id="contactPhone" v-model="bookingInfo.contactPhone" required placeholder="请输入联系电话">
        </div>
        
        <div class="form-actions">
          <button type="button" @click="cancelBooking" class="cancel-button">取消</button>
          <button type="submit" class="confirm-button">确认预订</button>
        </div>
      </form>
    </div>
    
    <!-- 成功提示 -->
    <div class="success-message" v-if="bookingSuccess">
      <h3>预订成功！</h3>
      <p>您的机票已成功预订，订单信息已保存。</p>
      <router-link to="/" class="back-button">返回首页</router-link>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  name: "booking",
  setup() {
    return {
      store: inject('store')
    };
  },
  data() {
    return {
      // 机场代码到城市名称的映射表
      airportMap: {
        'PEK': '北京',
        'SHA': '上海',
        'CAN': '广州',
        'SZX': '深圳',
        'CTU': '成都',
        'HGH': '杭州'
      },
      searchCriteria: {
        from: 'PEK',
        to: 'SHA',
        date: ''
      },
      flights: [],
      selectedFlight: null,
      bookingInfo: {
        passengerName: '',
        passengerId: '',
        contactPhone: ''
      },
      bookingSuccess: false,
      today: '',
      loading: false,
      errorMessage: ''
    }
  },
  created() {
    // 设置今天的日期为最小可选日期
    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    // 默认设置日期为今天
    this.searchCriteria.date = this.today;
  },
  computed: {
    availableFlights() {
      return this.store.getters.availableFlights
    }
  },
  methods: {
    async searchFlights() {
      if (this.searchCriteria.from === this.searchCriteria.to) {
        alert('出发城市和到达城市不能相同');
        return;
      }
      
      this.loading = true;
      this.errorMessage = '';
      
      try {
        this.flights = await this.store.dispatch('getFlights', this.searchCriteria);
        
        if (this.flights.length === 0) {
          this.errorMessage = '没有找到符合条件的航班，请尝试其他日期或航线';
        }
      } catch (error) {
        this.errorMessage = '搜索航班失败，请稍后重试';
        console.error('搜索航班失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    selectFlight(flight) {
      this.selectedFlight = flight;
      // 滚动到预订表单
      this.$nextTick(() => {
        const bookingForm = document.querySelector('.booking-form');
        if (bookingForm) {
          bookingForm.scrollIntoView({ behavior: 'smooth' });
        }
      });
    },
    
    cancelBooking() {
      this.selectedFlight = null;
      this.bookingInfo = {
        passengerName: '',
        passengerId: '',
        contactPhone: ''
      };
    },
    
    async submitBooking() {
      if (this.store && this.selectedFlight) {
        // 根据后端API文档，构建BookingCreateRequest格式的数据
        // 根据后端API文档，构建BookingCreateRequest格式的数据
        // 注意：flightId应该是航班实体的ID，而不是航班号
        // 这里为了兼容现有代码，我们假设flight.id已经是正确的航班ID
        const bookingData = {
          agencyId: 1, // 根据实际情况设置
          flightId: this.selectedFlight.id, // 系统会通过这个ID查询到正确的航班信息
          totalAmount: this.selectedFlight.price,
          depositAmount: 0,
          deadlinePickupAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后
          passengers: [
            {
              passengerId: 3, // 根据实际情况设置
              seatNo: '12A' // 座位号可选
            }
          ]
        };
        
        this.loading = true;
        this.errorMessage = '';
        
        try {
          // 提交预订
          const response = await this.store.dispatch('createBooking', bookingData);
          
          // 显示成功信息
          this.bookingSuccess = true;
          
          // 重置表单
          this.selectedFlight = null;
          this.bookingInfo = {
            passengerName: '',
            passengerId: '',
            contactPhone: ''
          };
          
          // 刷新航班列表
          this.searchFlights();
        } catch (error) {
          this.errorMessage = '预订失败，请稍后重试';
          console.error('预订失败:', error);
        } finally {
          this.loading = false;
        }
      }
    },
    
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
    }
  }
}
</script>

<style scoped>
.booking {
  max-width: 1000px;
  margin: 0 auto;
}

.search-form {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select {
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

.flight-results {
  margin-bottom: 2rem;
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

.flight-number {
  font-weight: bold;
  font-size: 1.2rem;
  color: #646cff;
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

.book-button {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.book-button:hover:not(:disabled) {
  background-color: #27ae60;
}

.book-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.booking-form {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.flight-summary {
  background-color: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #7f8c8d;
}

.confirm-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
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
</style>