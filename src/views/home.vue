<template>
  <div class="home">
    <div class="hero">
      <h2>欢迎使用 WingPass 航空票务系统</h2>
      <p>便捷的机票预订、退票、改签服务，让您的旅程更加轻松愉快</p>
    </div>
    
    <div class="features">
      <div class="feature-card">
        <h3>机票预订</h3>
        <p>快速查询和预订国内外航班，享受优惠价格</p>
        <router-link to="/booking" class="button">立即预订</router-link>
      </div>
      <div class="feature-card">
        <h3>退票申请</h3>
        <p>简单快捷的退票流程，无忧出行保障</p>
        <router-link to="/refund" class="button">申请退票</router-link>
      </div>
      <div class="feature-card">
        <h3>机票改签</h3>
        <p>灵活调整行程，轻松完成机票改签</p>
        <router-link to="/reschedule" class="button">立即改签</router-link>
      </div>
    </div>
    
    <div class="my-tickets" v-if="bookedTickets.length > 0">
      <h3>我的机票</h3>
      <div class="ticket-list">
        <div class="ticket-item" v-for="ticket in bookedTickets" :key="ticket.id">
          <div class="ticket-header">
            <span class="flight-number">{{ ticket.flightNumber }}</span>
            <span class="ticket-status">已预订</span>
          </div>
          <div class="ticket-info">
            <div class="route">
              <span class="city">{{ ticket.from }}</span>
              <span class="arrow">→</span>
              <span class="city">{{ ticket.to }}</span>
            </div>
            <div class="date-time">{{ ticket.date }} {{ ticket.time }}</div>
            <div class="passenger">乘客: {{ ticket.passengerName }}</div>
            <div class="price">¥{{ ticket.price }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-tickets">
      <p>您目前没有已预订的机票</p>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  name: "home",
  data() {
    return {
      bookedTickets: [],
      loading: false,
      hasBookedTickets: false
    }
  },
  created() {
    const store = inject('store');
    if (store) {
      this.bookedTickets = store.getters.bookedTickets;
      this.hasBookedTickets = this.bookedTickets.length > 0;
    }
  },
  watch: {
    // 监听store中的bookedTickets变化
    bookedTickets: {
      handler(newTickets) {
        this.hasBookedTickets = newTickets && newTickets.length > 0
      },
      immediate: true
    },
    // 监听store中getters的变化
    '$root.$.appContext.provides.store.getters.bookedTickets': {
      handler(newTickets) {
        this.bookedTickets = newTickets || []
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #646cff 0%, #747bff 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.hero h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.feature-card {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #646cff;
}

.button {
  display: inline-block;
  background-color: #646cff;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.button:hover {
  background-color: #535bf2;
}

.my-tickets {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
}

.ticket-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1rem;
}

.ticket-item {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ticket-header {
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

.ticket-status {
  background-color: #4caf50;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.ticket-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
}

.no-tickets {
  text-align: center;
  padding: 3rem 0;
  color: #666;
}
</style>