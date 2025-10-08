<template>
  <div class="flight-management">
    <h2>航班管理</h2>
    
    <!-- 功能选择 -->
    <div class="function-tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'delay' }"
        @click="activeTab = 'delay'"
      >
        航班延误
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'cancel' }"
        @click="activeTab = 'cancel'"
      >
        航班取消
      </button>
    </div>
    
    <!-- 航班列表 -->
    <div class="flight-list">
      <h3>所有航班</h3>
      <div class="flights-container">
        <div class="flight-item" v-for="flight in flights" :key="flight.id">
          <div class="flight-header">
            <span class="flight-number">{{ flight.id }}</span>
            <span class="flight-status" :class="getStatusClass(flight.status)">
              {{ getStatusText(flight.status) }}
            </span>
          </div>
          
          <div class="flight-info">
            <div class="route">
              <span class="city">{{ airportMap[flight.from] || flight.from }}</span>
              <span class="arrow">→</span>
              <span class="city">{{ airportMap[flight.to] || flight.to }}</span>
            </div>
            <div class="date-time">
              {{ flight.date }} {{ flight.time }}
            </div>
            <div class="airplane-info">
              <p>机型: {{ flight.airplane || '未知' }}</p>
              <p>剩余座位: {{ flight.seatsAvailable }}/{{ flight.capacity || '未知' }}</p>
            </div>
          </div>
          
          <div class="flight-actions">
            <button 
              @click="handleFlightAction(flight)" 
              class="action-button"
              :class="activeTab"
              :disabled="!canPerformAction(flight)"
            >
              {{ getActionButtonText() }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作对话框 -->
    <div class="modal-overlay" v-if="showActionModal" @click="closeActionModal">
      <div class="modal-content" @click.stop>
        <h3>{{ getActionModalTitle() }}</h3>
        
        <div v-if="selectedFlight" class="selected-flight-info">
          <p>航班: {{ selectedFlight.id }}</p>
          <p>航线: {{ airportMap[selectedFlight.from] || selectedFlight.from }} → {{ airportMap[selectedFlight.to] || selectedFlight.to }}</p>
          <p>日期: {{ selectedFlight.date }} {{ selectedFlight.time }}</p>
        </div>
        
        <!-- 延误表单 -->
        <div v-if="activeTab === 'delay'" class="action-form">
          <div class="form-group">
            <label for="newDepTime">新的出发时间</label>
            <input 
              type="datetime-local" 
              id="newDepTime" 
              v-model="delayForm.newDepTime"
              required
              min="{{ getMinDateTime() }}"
            >
          </div>
          
          <div class="form-group">
            <label for="newArrTime">新的到达时间</label>
            <input 
              type="datetime-local" 
              id="newArrTime" 
              v-model="delayForm.newArrTime"
              required
              min="{{ getMinDateTime() }}"
            >
          </div>
          
          <div class="form-group">
            <label for="pickupDeadlineOffsetHours">登机截止时间偏移（小时）</label>
            <input 
              type="number" 
              id="pickupDeadlineOffsetHours" 
              v-model="delayForm.pickupDeadlineOffsetHours"
              min="0"
              max="24"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="delayReason">延误原因</label>
            <textarea 
              id="delayReason" 
              v-model="delayForm.reason"
              rows="3"
              required
            ></textarea>
          </div>
        </div>
        
        <!-- 取消表单 -->
        <div v-if="activeTab === 'cancel'" class="action-form">
          <div class="form-group">
            <label for="cancelReason">取消原因</label>
            <textarea 
              id="cancelReason" 
              v-model="cancelForm.reason"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="ticketPolicy">票务处理政策</label>
            <select id="ticketPolicy" v-model="cancelForm.ticketPolicy" required>
              <option value="REFUND">全额退款</option>
              <option value="RESCHEDULE">改签</option>
              <option value="REFUND_WITH_FEE">部分退款</option>
            </select>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeActionModal" class="cancel-button">取消</button>
          <button @click="confirmAction" class="confirm-button">确认{{ getActionName() }}</button>
        </div>
      </div>
    </div>
    
    <!-- 操作成功提示 -->
    <div class="success-message" v-if="actionSuccess">
      <h3>{{ getActionName() }}成功！</h3>
      <p>{{ getSuccessMessage() }}</p>
      <button @click="actionSuccess = false" class="back-button">确定</button>
    </div>
    
    <!-- 错误提示 -->
    <div class="error-message" v-if="errorMessage">
      <h3>操作失败</h3>
      <p>{{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="back-button">关闭</button>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  name: 'FlightManagement',
  setup() {
    return {
      store: inject('store')
    };
  },
  data() {
    return {
      activeTab: 'delay', // 'delay' 或 'cancel'
      flights: [],
      selectedFlight: null,
      showActionModal: false,
      actionSuccess: false,
      errorMessage: '',
      loading: false,
      // 延误表单数据
      delayForm: {
        newDepTime: '',
        newArrTime: '',
        pickupDeadlineOffsetHours: 2,
        reason: ''
      },
      // 取消表单数据
      cancelForm: {
        reason: '',
        ticketPolicy: 'REFUND'
      },
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
  created() {
    if (this.store) {
      this.loadFlights();
    }
  },
  methods: {
    // 加载航班列表
    async loadFlights() {
      this.loading = true;
      try {
        // 假设getFlights返回所有航班，这里可能需要调整
        this.flights = await this.store.dispatch('getFlights', {});
      } catch (error) {
        this.errorMessage = '加载航班列表失败，请稍后重试';
        console.error('加载航班列表失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'NORMAL': '正常',
        'DELAYED': '延误',
        'CANCELLED': '取消'
      };
      return statusMap[status] || '未知';
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const classMap = {
        'NORMAL': 'normal',
        'DELAYED': 'delayed',
        'CANCELLED': 'cancelled'
      };
      return classMap[status] || '';
    },
    
    // 检查是否可以执行操作
    canPerformAction(flight) {
      // 只有正常状态的航班才能执行延误或取消操作
      return flight.status === 'NORMAL';
    },
    
    // 获取操作按钮文本
    getActionButtonText() {
      return this.activeTab === 'delay' ? '延误此航班' : '取消此航班';
    },
    
    // 获取操作名称
    getActionName() {
      return this.activeTab === 'delay' ? '延误' : '取消';
    },
    
    // 获取操作对话框标题
    getActionModalTitle() {
      return this.activeTab === 'delay' ? '航班延误' : '航班取消';
    },
    
    // 获取成功消息
    getSuccessMessage() {
      return this.activeTab === 'delay' 
        ? `航班${this.selectedFlight.id}已成功延误，相关预订已通知。` 
        : `航班${this.selectedFlight.id}已成功取消，相关预订已通知。`;
    },
    
    // 获取最小日期时间（当前时间）
    getMinDateTime() {
      const now = new Date();
      return now.toISOString().slice(0, 16);
    },
    
    // 处理航班操作
    handleFlightAction(flight) {
      this.selectedFlight = flight;
      this.showActionModal = true;
      
      // 重置表单
      if (this.activeTab === 'delay') {
        // 设置默认的新出发时间（当前时间+1小时）
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        this.delayForm.newDepTime = defaultTime.toISOString().slice(0, 16);
        this.delayForm.newArrTime = defaultTime.toISOString().slice(0, 16);
        this.delayForm.pickupDeadlineOffsetHours = 2;
        this.delayForm.reason = '';
      } else {
        this.cancelForm.reason = '';
        this.cancelForm.ticketPolicy = 'REFUND';
      }
    },
    
    // 关闭操作对话框
    closeActionModal() {
      this.showActionModal = false;
      this.selectedFlight = null;
    },
    
    // 确认操作
    async confirmAction() {
      if (!this.selectedFlight) {
        return;
      }
      
      this.loading = true;
      this.errorMessage = '';
      
      try {
        if (this.activeTab === 'delay') {
          // 执行航班延误操作
          const delayRequest = {
            flightId: this.selectedFlight.id,
            newDepTime: this.delayForm.newDepTime,
            newArrTime: this.delayForm.newArrTime,
            pickupDeadlineOffsetHours: this.delayForm.pickupDeadlineOffsetHours,
            reason: this.delayForm.reason
          };
          
          await this.store.dispatch('delayFlight', delayRequest);
        } else {
          // 执行航班取消操作
          const cancelRequest = {
            flightId: this.selectedFlight.id,
            reason: this.cancelForm.reason,
            ticketPolicy: this.cancelForm.ticketPolicy
          };
          
          await this.store.dispatch('cancelFlight', cancelRequest);
        }
        
        // 关闭对话框
        this.closeActionModal();
        
        // 重新加载航班列表
        await this.loadFlights();
        
        // 显示成功信息
        this.actionSuccess = true;
        
        // 3秒后重置成功状态
        setTimeout(() => {
          this.actionSuccess = false;
        }, 3000);
      } catch (error) {
        this.errorMessage = `${this.getActionName()}航班失败，请稍后重试`;
        console.error(`${this.getActionName()}航班失败:`, error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.flight-management {
  max-width: 1200px;
  margin: 0 auto;
}

.function-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-button {
  background-color: #f0f0f0;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tab-button:hover {
  background-color: #e0e0e0;
}

.tab-button.active {
  background-color: #646cff;
  color: white;
}

.flight-list {
  margin-bottom: 2rem;
}

.flights-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
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
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.flight-number {
  font-weight: bold;
  font-size: 1.2rem;
  color: #646cff;
}

.flight-status {
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.9rem;
  color: white;
}

.flight-status.normal {
  background-color: #4caf50;
}

.flight-status.delayed {
  background-color: #f39c12;
}

.flight-status.cancelled {
  background-color: #e74c3c;
}

.flight-info {
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

.airplane-info {
  margin-bottom: 1rem;
}

.airplane-info p {
  margin: 0.5rem 0;
  color: #333;
}

.flight-actions {
  text-align: center;
}

.action-button {
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.action-button.delay {
  background-color: #f39c12;
  color: white;
}

.action-button.delay:hover:not(:disabled) {
  background-color: #e67e22;
}

.action-button.cancel {
  background-color: #e74c3c;
  color: white;
}

.action-button.cancel:hover:not(:disabled) {
  background-color: #c0392b;
}

.action-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
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

.selected-flight-info {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.selected-flight-info p {
  margin: 0.5rem 0;
}

.action-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
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
  background-color: #646cff;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.confirm-button:hover {
  background-color: #535bf2;
}

.success-message {
  text-align: center;
  background-color: #d5f4e6;
  padding: 3rem;
  border-radius: 8px;
  border: 1px solid #82e0aa;
}

.error-message {
  text-align: center;
  background-color: #fadbd8;
  padding: 3rem;
  border-radius: 8px;
  border: 1px solid #f1948a;
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
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.back-button:hover {
  background-color: #535bf2;
}
</style>