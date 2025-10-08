<template>
  <div class="payment-container">
    <div class="header">
      <h1>支付确认</h1>
      <button class="back-button" @click="goBack">← 返回</button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载订单信息中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchOrderDetails" class="retry-button">重试</button>
    </div>
    
    <div v-else class="main-content">
      <div class="order-summary">
        <h2>订单摘要</h2>
        
        <div class="flight-info">
          <div class="flight-header">
            <div class="route">
              <span class="city">{{ orderDetail.departureCity }}</span>
              <div class="arrow">→</div>
              <span class="city">{{ orderDetail.arrivalCity }}</span>
            </div>
            <div class="flight-number">航班号: {{ orderDetail.flightNumber }}</div>
          </div>
          
          <div class="flight-time">
            <div class="time-info">
              <span class="time">{{ formatTime(orderDetail.departureTime) }}</span>
              <span class="date">{{ formatDate(orderDetail.departureTime) }}</span>
              <span class="airport">{{ orderDetail.departureAirport }}</span>
            </div>
            
            <div class="duration">
              <div class="line"></div>
              <span class="time">{{ formatDuration(orderDetail.duration) }}</span>
            </div>
            
            <div class="time-info">
              <span class="time">{{ formatTime(orderDetail.arrivalTime) }}</span>
              <span class="date">{{ formatDate(orderDetail.arrivalTime) }}</span>
              <span class="airport">{{ orderDetail.arrivalAirport }}</span>
            </div>
          </div>
        </div>
        
        <div class="passengers">
          <h3>乘机人信息</h3>
          <div v-for="(passenger, index) in orderDetail.passengers" :key="index" class="passenger-item">
            <div class="passenger-name">{{ passenger.name }}</div>
            <div class="passenger-id">{{ maskPassengerId(passenger.idNumber) }}</div>
            <div class="passenger-type">{{ passenger.type }}</div>
          </div>
        </div>
        
        <div class="price-summary">
          <h3>费用明细</h3>
          <div class="price-row">
            <span class="label">机票基础价 ({{ orderDetail.passengers.length }}人)</span>
            <span class="value">¥{{ formatPrice(orderDetail.basePrice * orderDetail.passengers.length) }}</span>
          </div>
          <div class="price-row">
            <span class="label">税费</span>
            <span class="value">¥{{ formatPrice(orderDetail.taxes) }}</span>
          </div>
          <div class="price-row">
            <span class="label">燃油附加费</span>
            <span class="value">¥{{ formatPrice(orderDetail.fuelSurcharge) }}</span>
          </div>
          <div v-if="orderDetail.insuranceFee > 0" class="price-row">
            <span class="label">保险费</span>
            <span class="value">¥{{ formatPrice(orderDetail.insuranceFee) }}</span>
          </div>
          <div v-if="orderDetail.discount > 0" class="price-row discount">
            <span class="label">优惠</span>
            <span class="value">-¥{{ formatPrice(orderDetail.discount) }}</span>
          </div>
          <div class="price-row total">
            <span class="label">实付金额</span>
            <span class="value">¥{{ formatPrice(totalAmount) }}</span>
          </div>
        </div>
      </div>
      
      <div class="payment-methods">
        <h2>选择支付方式</h2>
        
        <div class="method-group">
          <h3>在线支付</h3>
          <div class="payment-options">
            <label class="payment-option" :class="{ selected: paymentMethod === 'alipay' }">
              <input type="radio" name="paymentMethod" value="alipay" v-model="paymentMethod" />
              <div class="option-content">
                <img src="https://gw.alipayobjects.com/zos/rmsportal/XuVpGqBFxXplzvLjJBZB.svg" alt="支付宝" class="payment-icon" />
                <span class="option-text">支付宝</span>
              </div>
            </label>
            
            <label class="payment-option" :class="{ selected: paymentMethod === 'wechat' }">
              <input type="radio" name="paymentMethod" value="wechat" v-model="paymentMethod" />
              <div class="option-content">
                <img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" alt="微信支付" class="payment-icon" />
                <span class="option-text">微信支付</span>
              </div>
            </label>
            
            <label class="payment-option" :class="{ selected: paymentMethod === 'unionpay' }">
              <input type="radio" name="paymentMethod" value="unionpay" v-model="paymentMethod" />
              <div class="option-content">
                <img src="https://www.unionpayintl.com/upload/image/20200818/1597721155925098.png" alt="银联" class="payment-icon" />
                <span class="option-text">银联支付</span>
              </div>
            </label>
          </div>
        </div>
        
        <div class="method-group">
          <h3>其他支付</h3>
          <div class="payment-options">
            <label class="payment-option" :class="{ selected: paymentMethod === 'companyAccount' }">
              <input type="radio" name="paymentMethod" value="companyAccount" v-model="paymentMethod" />
              <div class="option-content">
                <i class="company-icon"></i>
                <span class="option-text">公司账户</span>
              </div>
            </label>
            
            <label class="payment-option" :class="{ selected: paymentMethod === 'travelAgency' }">
              <input type="radio" name="paymentMethod" value="travelAgency" v-model="paymentMethod" />
              <div class="option-content">
                <i class="travel-icon"></i>
                <span class="option-text">旅行社账户</span>
              </div>
            </label>
          </div>
        </div>
      </div>
      
      <div class="payment-actions">
        <div class="price-display">
          <span class="label">应付总额:</span>
          <span class="price">¥{{ formatPrice(totalAmount) }}</span>
        </div>
        
        <div class="countdown" v-if="timeLeft > 0">
          <span>订单将在</span>
          <span class="time-left">{{ formatCountdown(timeLeft) }}</span>
          <span>后自动取消</span>
        </div>
        
        <button class="pay-button" :disabled="processingPayment" @click="processPayment">
          <span v-if="!processingPayment">确认支付</span>
          <span v-else>支付处理中...</span>
        </button>
      </div>
    </div>
    
    <!-- 支付结果模态框 -->
    <div v-if="showResultModal" class="modal-overlay" @click="closeResultModal">
      <div class="modal-content" @click.stop>
        <div class="result-icon" :class="paymentResult ? 'success' : 'failed'">
          <i v-if="paymentResult" class="success-icon"></i>
          <i v-else class="failed-icon"></i>
        </div>
        
        <h2 class="result-title">{{ paymentResult ? '支付成功' : '支付失败' }}</h2>
        
        <p class="result-message">
          {{ paymentResult ? 
            '您的订单已支付成功，我们将尽快为您出票' : 
            '支付处理过程中遇到问题，请重试或选择其他支付方式'
          }}
        </p>
        
        <div v-if="paymentResult" class="result-details">
          <div class="detail-row">
            <span class="label">订单号:</span>
            <span class="value">{{ orderDetail.orderNumber }}</span>
          </div>
          <div class="detail-row">
            <span class="label">支付时间:</span>
            <span class="value">{{ formatDateTime(new Date()) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">支付方式:</span>
            <span class="value">{{ getPaymentMethodText(paymentMethod) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">支付金额:</span>
            <span class="value">¥{{ formatPrice(totalAmount) }}</span>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="!paymentResult" 
            class="retry-payment-button" 
            @click="closeResultModal"
          >
            重新支付
          </button>
          <button 
            class="view-order-button" 
            @click="viewOrderDetail"
          >
            {{ paymentResult ? '查看订单' : '返回订单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default defineComponent({
  name: 'Payment',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    const loading = ref(true);
    const error = ref(null);
    const processingPayment = ref(false);
    const showResultModal = ref(false);
    const paymentResult = ref(null);
    const paymentMethod = ref('alipay');
    const timeLeft = ref(1800); // 30分钟倒计时，单位秒
    
    // 订单详情数据
    const orderDetail = ref({
      orderNumber: '',
      flightNumber: '',
      departureCity: '',
      arrivalCity: '',
      departureAirport: '',
      arrivalAirport: '',
      departureTime: '',
      arrivalTime: '',
      duration: 0,
      basePrice: 0,
      taxes: 0,
      fuelSurcharge: 0,
      insuranceFee: 0,
      discount: 0,
      passengers: []
    });
    
    let countdownTimer = null;
    
    const totalAmount = computed(() => {
      return orderDetail.value.basePrice * orderDetail.value.passengers.length + 
             orderDetail.value.taxes + 
             orderDetail.value.fuelSurcharge + 
             orderDetail.value.insuranceFee - 
             orderDetail.value.discount;
    });
    
    const fetchOrderDetails = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // 在实际项目中，这里应该调用API获取订单详情
        // 从路由参数中获取订单ID
        const orderId = route.params.id || 'test_order_123';
        
        // 模拟数据
        orderDetail.value = generateMockOrderDetail(orderId);
      } catch (err) {
        error.value = err.message || '获取订单详情失败';
        console.error('获取订单详情错误:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const generateMockOrderDetail = (orderId) => {
      const departureTime = new Date();
      departureTime.setDate(departureTime.getDate() + 7);
      
      const arrivalTime = new Date(departureTime);
      arrivalTime.setHours(arrivalTime.getHours() + 3);
      
      return {
        orderNumber: orderId || 'ORD' + Date.now().toString().slice(-8),
        flightNumber: 'CA1234',
        departureCity: '北京',
        arrivalCity: '上海',
        departureAirport: '首都国际机场T2',
        arrivalAirport: '浦东国际机场T1',
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        duration: 180, // 分钟
        basePrice: 1200,
        taxes: 100,
        fuelSurcharge: 50,
        insuranceFee: 60,
        discount: 100,
        passengers: [
          {
            name: '张三',
            idNumber: '110101199001011234',
            type: '成人'
          },
          {
            name: '李四',
            idNumber: '110101199203045678',
            type: '成人'
          }
        ]
      };
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };
    
    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };
    
    const formatDateTime = (date) => {
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    };
    
    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}时${mins}分`;
    };
    
    const formatPrice = (price) => {
      return price.toFixed(2);
    };
    
    const maskPassengerId = (idNumber) => {
      if (!idNumber) return '';
      return idNumber.substring(0, 6) + '********' + idNumber.substring(idNumber.length - 4);
    };
    
    const formatCountdown = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const getPaymentMethodText = (method) => {
      const methodTexts = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'unionpay': '银联支付',
        'companyAccount': '公司账户',
        'travelAgency': '旅行社账户'
      };
      return methodTexts[method] || method;
    };
    
    const startCountdown = () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
      
      countdownTimer = setInterval(() => {
        timeLeft.value--;
        if (timeLeft.value <= 0) {
          clearInterval(countdownTimer);
          // 订单超时自动取消
          alert('订单已超时，请重新下单');
          goBack();
        }
      }, 1000);
    };
    
    const processPayment = async () => {
      if (processingPayment.value) return;
      
      processingPayment.value = true;
      
      try {
        // 模拟支付处理
        // 在实际项目中，这里应该调用支付API
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 随机模拟支付结果（实际项目中应该根据API返回判断）
        const isSuccess = Math.random() > 0.2; // 80%成功率
        paymentResult.value = isSuccess;
      } catch (err) {
        console.error('支付处理错误:', err);
        paymentResult.value = false;
      } finally {
        processingPayment.value = false;
        showResultModal.value = true;
      }
    };
    
    const closeResultModal = () => {
      showResultModal.value = false;
    };
    
    const viewOrderDetail = () => {
      closeResultModal();
      router.push(`/booking-detail/${orderDetail.value.orderNumber}`);
    };
    
    const goBack = () => {
      router.back();
    };
    
    onMounted(() => {
      fetchOrderDetails();
      startCountdown();
    });
    
    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    });
    
    return {
      loading,
      error,
      processingPayment,
      showResultModal,
      paymentResult,
      paymentMethod,
      timeLeft,
      orderDetail,
      totalAmount,
      fetchOrderDetails,
      formatDate,
      formatTime,
      formatDateTime,
      formatDuration,
      formatPrice,
      maskPassengerId,
      formatCountdown,
      getPaymentMethodText,
      processPayment,
      closeResultModal,
      viewOrderDetail,
      goBack
    };
  }
});
</script>

<style scoped>
.payment-container {
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
  background: none;
  border: 1px solid #bdc3c7;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  color: #2c3e50;
  font-size: 14px;
}

.back-button:hover {
  background-color: #ecf0f1;
}

.loading-container, .error-container {
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

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 992px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

.order-summary, .payment-methods {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.order-summary h2, .payment-methods h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
}

.flight-info {
  border-bottom: 1px solid #ecf0f1;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.flight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.route {
  display: flex;
  align-items: center;
  gap: 15px;
}

.city {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.arrow {
  font-size: 20px;
  color: #7f8c8d;
}

.flight-number {
  font-size: 14px;
  color: #7f8c8d;
}

.flight-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-info {
  text-align: center;
}

.time-info .time {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
}

.time-info .date, .time-info .airport {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

.duration {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.line {
  width: 80px;
  height: 2px;
  background-color: #ecf0f1;
  position: relative;
}

.line::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background-color: #3498db;
  border-radius: 50%;
}

.duration .time {
  font-size: 12px;
  color: #7f8c8d;
}

.passengers {
  border-bottom: 1px solid #ecf0f1;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.passengers h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
}

.passenger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.passenger-item:last-child {
  border-bottom: none;
}

.passenger-name {
  font-weight: 500;
  color: #2c3e50;
}

.passenger-id {
  color: #7f8c8d;
  font-size: 14px;
}

.passenger-type {
  color: #3498db;
  font-size: 14px;
}

.price-summary h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.price-row .label {
  color: #7f8c8d;
  font-size: 14px;
}

.price-row .value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.price-row.discount .value {
  color: #e74c3c;
}

.price-row.total {
  font-size: 16px;
  font-weight: bold;
  padding-top: 15px;
  margin-top: 10px;
  border-top: 2px solid #ecf0f1;
}

.price-row.total .label {
  color: #2c3e50;
  font-weight: bold;
}

.price-row.total .value {
  color: #e74c3c;
  font-size: 18px;
}

.method-group {
  margin-bottom: 25px;
}

.method-group:last-child {
  margin-bottom: 0;
}

.method-group h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
}

.payment-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.payment-option {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.payment-option:hover {
  border-color: #3498db;
}

.payment-option.selected {
  border-color: #3498db;
  background-color: #f8fbfe;
}

.payment-option input[type="radio"] {
  margin-right: 10px;
  cursor: pointer;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.payment-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.company-icon, .travel-icon {
  width: 30px;
  height: 30px;
  background-color: #7f8c8d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.option-text {
  color: #2c3e50;
  font-weight: 500;
}

.payment-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.price-display {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.price-display .label {
  color: #7f8c8d;
  font-size: 16px;
}

.price-display .price {
  color: #e74c3c;
  font-size: 24px;
  font-weight: bold;
}

.countdown {
  color: #7f8c8d;
  font-size: 14px;
}

.time-left {
  color: #e74c3c;
  font-weight: bold;
  font-size: 16px;
  margin: 0 5px;
}

.pay-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.pay-button:hover:not(:disabled) {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.pay-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  padding: 40px;
  text-align: center;
}

.result-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-icon.success {
  background-color: #d5f4e6;
}

.result-icon.failed {
  background-color: #ffe6e6;
}

.success-icon::before {
  content: '✓';
  color: #27ae60;
  font-size: 40px;
  font-weight: bold;
}

.failed-icon::before {
  content: '✗';
  color: #e74c3c;
  font-size: 40px;
  font-weight: bold;
}

.result-title {
  color: #2c3e50;
  margin: 0 0 15px;
  font-size: 24px;
}

.result-message {
  color: #7f8c8d;
  margin: 0 0 25px;
  line-height: 1.6;
}

.result-details {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ecf0f1;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  color: #7f8c8d;
  font-size: 14px;
}

.detail-row .value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.retry-payment-button, .view-order-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.retry-payment-button {
  background-color: #7f8c8d;
  color: white;
}

.retry-payment-button:hover {
  background-color: #6c757d;
}

.view-order-button {
  background-color: #3498db;
  color: white;
}

.view-order-button:hover {
  background-color: #2980b9;
}

@media (max-width: 768px) {
  .payment-container {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .main-content {
    gap: 15px;
  }
  
  .order-summary, .payment-methods, .payment-actions {
    padding: 15px;
  }
  
  .city {
    font-size: 20px;
  }
  
  .line {
    width: 40px;
  }
  
  .payment-options {
    flex-direction: column;
  }
  
  .payment-option {
    width: 100%;
  }
  
  .payment-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .modal-content {
    margin: 20px;
    width: calc(100% - 40px);
    padding: 25px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .retry-payment-button, .view-order-button {
    width: 100%;
  }
}
</style>