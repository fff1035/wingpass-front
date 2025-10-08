<template>
  <div class="notification-center-container">
    <div class="header">
      <h1>通知中心</h1>
      <div class="header-actions">
        <button class="mark-all-read-button" @click="markAllAsRead" :disabled="!hasUnreadNotifications">
          全部标记为已读
        </button>
        <button class="delete-all-button" @click="deleteAllNotifications" :disabled="notifications.length === 0">
          清空通知
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载通知中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchNotifications" class="retry-button">重试</button>
    </div>
    
    <div v-else class="main-content">
      <div class="notification-tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'all' }"
          @click="switchTab('all')"
        >
          全部通知
          <span v-if="totalNotifications > 0" class="badge">{{ totalNotifications }}</span>
        </button>
        
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'unread' }"
          @click="switchTab('unread')"
        >
          未读通知
          <span v-if="unreadCount > 0" class="badge unread">{{ unreadCount }}</span>
        </button>
        
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'system' }"
          @click="switchTab('system')"
        >
          系统通知
          <span v-if="systemCount > 0" class="badge">{{ systemCount }}</span>
        </button>
        
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'flight' }"
          @click="switchTab('flight')"
        >
          航班通知
          <span v-if="flightCount > 0" class="badge">{{ flightCount }}</span>
        </button>
        
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'order' }"
          @click="switchTab('order')"
        >
          订单通知
          <span v-if="orderCount > 0" class="badge">{{ orderCount }}</span>
        </button>
      </div>
      
      <div class="search-filter">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索通知内容..."
            @input="handleSearch"
          />
          <button class="search-button">🔍</button>
        </div>
      </div>
      
      <div class="notification-list">
        <div v-if="filteredNotifications.length === 0" class="empty-state">
          <div class="empty-icon"></div>
          <p>{{ getEmptyStateText() }}</p>
        </div>
        
        <div v-else class="notifications">
          <div 
            v-for="notification in filteredNotifications" 
            :key="notification.id" 
            class="notification-item" 
            :class="{ unread: !notification.isRead }"
            @click="viewNotification(notification)"
          >
            <div class="notification-icon" :class="notification.type">
              <i>{{ getNotificationIcon(notification.type) }}</i>
            </div>
            
            <div class="notification-content">
              <div class="notification-header">
                <h3 class="notification-title">{{ notification.title }}</h3>
                <span class="notification-time">{{ formatTimeAgo(notification.createdAt) }}</span>
              </div>
              
              <p class="notification-message">{{ notification.message }}</p>
              
              <div v-if="notification.relatedInfo" class="related-info">
                <div 
                  v-if="notification.type === 'flight' && notification.relatedInfo.flightNumber"
                  class="flight-info"
                >
                  <span>航班: {{ notification.relatedInfo.flightNumber }}</span>
                  <span>时间: {{ formatDate(notification.relatedInfo.flightDate) }}</span>
                </div>
                
                <div 
                  v-if="notification.type === 'order' && notification.relatedInfo.orderNumber"
                  class="order-info"
                >
                  <span>订单号: {{ notification.relatedInfo.orderNumber }}</span>
                </div>
              </div>
            </div>
            
            <div class="notification-actions">
              <button 
                v-if="!notification.isRead" 
                class="mark-read-button"
                @click.stop="markAsRead(notification.id)"
                title="标记为已读"
              >
                ✓
              </button>
              <button 
                class="delete-button"
                @click.stop="deleteNotification(notification.id)"
                title="删除通知"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 通知详情模态框 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedNotification?.title }}</h2>
          <button class="close-button" @click="closeDetailModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-header">
            <div class="notification-icon" :class="selectedNotification?.type">
              <i>{{ getNotificationIcon(selectedNotification?.type) }}</i>
            </div>
            <div class="detail-meta">
              <span class="notification-time">{{ formatDateTime(selectedNotification?.createdAt) }}</span>
              <span class="notification-type">{{ getNotificationTypeText(selectedNotification?.type) }}</span>
            </div>
          </div>
          
          <div class="detail-content">
            <p class="detail-message">{{ selectedNotification?.message }}</p>
            
            <div v-if="selectedNotification?.relatedInfo" class="detail-related-info">
              <h4>相关信息</h4>
              <div 
                v-if="selectedNotification.type === 'flight' && selectedNotification.relatedInfo.flightNumber"
                class="flight-detail-info"
              >
                <div class="info-row">
                  <span class="label">航班号:</span>
                  <span class="value">{{ selectedNotification.relatedInfo.flightNumber }}</span>
                </div>
                <div class="info-row">
                  <span class="label">出发地:</span>
                  <span class="value">{{ selectedNotification.relatedInfo.departureCity }}</span>
                </div>
                <div class="info-row">
                  <span class="label">目的地:</span>
                  <span class="value">{{ selectedNotification.relatedInfo.arrivalCity }}</span>
                </div>
                <div class="info-row">
                  <span class="label">出发时间:</span>
                  <span class="value">{{ formatDateTime(selectedNotification.relatedInfo.flightDate) }}</span>
                </div>
                <button 
                  v-if="selectedNotification.relatedInfo.flightId"
                  class="view-flight-button"
                  @click="viewRelatedFlight(selectedNotification.relatedInfo.flightId)"
                >
                  查看航班详情
                </button>
              </div>
              
              <div 
                v-if="selectedNotification.type === 'order' && selectedNotification.relatedInfo.orderNumber"
                class="order-detail-info"
              >
                <div class="info-row">
                  <span class="label">订单号:</span>
                  <span class="value">{{ selectedNotification.relatedInfo.orderNumber }}</span>
                </div>
                <div class="info-row">
                  <span class="label">订单金额:</span>
                  <span class="value">¥{{ formatPrice(selectedNotification.relatedInfo.amount) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">订单状态:</span>
                  <span class="value">{{ selectedNotification.relatedInfo.status }}</span>
                </div>
                <button 
                  v-if="selectedNotification.relatedInfo.orderId"
                  class="view-order-button"
                  @click="viewRelatedOrder(selectedNotification.relatedInfo.orderId)"
                >
                  查看订单详情
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="close-modal-button" @click="closeDetailModal">关闭</button>
          <button 
            v-if="selectedNotification && !selectedNotification.isRead"
            class="mark-read-modal-button"
            @click="markAsRead(selectedNotification.id)"
          >
            标记为已读
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'NotificationCenter',
  setup() {
    const store = useStore();
    const router = useRouter();
    
    const loading = ref(true);
    const error = ref(null);
    const notifications = ref([]);
    const activeTab = ref('all');
    const searchQuery = ref('');
    
    // 模态框相关状态
    const showDetailModal = ref(false);
    const selectedNotification = ref(null);
    
    const totalNotifications = computed(() => notifications.value.length);
    
    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.isRead).length;
    });
    
    const systemCount = computed(() => {
      return notifications.value.filter(n => n.type === 'system').length;
    });
    
    const flightCount = computed(() => {
      return notifications.value.filter(n => n.type === 'flight').length;
    });
    
    const orderCount = computed(() => {
      return notifications.value.filter(n => n.type === 'order').length;
    });
    
    const hasUnreadNotifications = computed(() => {
      return unreadCount.value > 0;
    });
    
    const filteredNotifications = computed(() => {
      let filtered = [...notifications.value];
      
      // 按标签过滤
      if (activeTab.value !== 'all') {
        if (activeTab.value === 'unread') {
          filtered = filtered.filter(n => !n.isRead);
        } else {
          filtered = filtered.filter(n => n.type === activeTab.value);
        }
      }
      
      // 按搜索关键词过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(n => 
          n.title.toLowerCase().includes(query) || 
          n.message.toLowerCase().includes(query) ||
          (n.relatedInfo && JSON.stringify(n.relatedInfo).toLowerCase().includes(query))
        );
      }
      
      // 按时间倒序排列
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return filtered;
    });
    
    const fetchNotifications = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // 在实际项目中，这里应该调用API获取通知列表
        // 模拟数据
        notifications.value = generateMockNotifications();
      } catch (err) {
        error.value = err.message || '获取通知失败';
        console.error('获取通知错误:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const generateMockNotifications = () => {
      const mockNotifications = [
        {
          id: 'notif_1',
          title: '航班延误通知',
          message: '您乘坐的CA1234航班因天气原因延误，请关注最新航班动态。',
          type: 'flight',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1小时前
          relatedInfo: {
            flightNumber: 'CA1234',
            flightDate: '2023-06-15T08:30:00Z',
            departureCity: '北京',
            arrivalCity: '上海',
            flightId: 'flight_1234'
          }
        },
        {
          id: 'notif_2',
          title: '订单支付成功',
          message: '您的订单ORD876543已支付成功，我们将尽快为您出票。',
          type: 'order',
          isRead: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2小时前
          relatedInfo: {
            orderNumber: 'ORD876543',
            amount: 2560.00,
            status: '已支付',
            orderId: 'order_876543'
          }
        },
        {
          id: 'notif_3',
          title: '系统维护通知',
          message: '系统将于6月20日凌晨2:00-4:00进行例行维护，期间部分服务可能暂时不可用。',
          type: 'system',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1天前
          relatedInfo: {}
        },
        {
          id: 'notif_4',
          title: '机票已出票',
          message: '您的订单ORD876543已出票成功，电子客票号为ETK123456789。',
          type: 'order',
          isRead: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2天前
          relatedInfo: {
            orderNumber: 'ORD876543',
            ticketNumber: 'ETK123456789',
            orderId: 'order_876543'
          }
        },
        {
          id: 'notif_5',
          title: '航班取消通知',
          message: '非常抱歉，您预订的MU5678航班已取消，请联系客服安排退票或改签事宜。',
          type: 'flight',
          isRead: true,
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3天前
          relatedInfo: {
            flightNumber: 'MU5678',
            flightDate: '2023-06-18T14:20:00Z',
            departureCity: '广州',
            arrivalCity: '北京',
            flightId: 'flight_5678'
          }
        },
        {
          id: 'notif_6',
          title: '账户安全提醒',
          message: '您的账户于异地登录，如非本人操作，请立即修改密码。',
          type: 'system',
          isRead: true,
          createdAt: new Date(Date.now() - 345600000).toISOString(), // 4天前
          relatedInfo: {
            loginLocation: '上海市',
            loginTime: '2023-06-11T09:15:00Z'
          }
        }
      ];
      
      return mockNotifications;
    };
    
    const switchTab = (tab) => {
      activeTab.value = tab;
    };
    
    const handleSearch = () => {
      // 搜索逻辑已在computed属性中处理
    };
    
    const viewNotification = (notification) => {
      selectedNotification.value = { ...notification };
      showDetailModal.value = true;
      
      // 如果是未读通知，标记为已读
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
    };
    
    const closeDetailModal = () => {
      showDetailModal.value = false;
      selectedNotification.value = null;
    };
    
    const markAsRead = (notificationId) => {
      // 在实际项目中，这里应该调用API标记通知为已读
      const notification = notifications.value.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
      }
      
      // 如果当前正在查看该通知，更新选中的通知
      if (selectedNotification.value && selectedNotification.value.id === notificationId) {
        selectedNotification.value.isRead = true;
      }
    };
    
    const markAllAsRead = () => {
      // 在实际项目中，这里应该调用API标记所有通知为已读
      notifications.value.forEach(n => {
        n.isRead = true;
      });
    };
    
    const deleteNotification = (notificationId) => {
      if (confirm('确定要删除这条通知吗？')) {
        // 在实际项目中，这里应该调用API删除通知
        notifications.value = notifications.value.filter(n => n.id !== notificationId);
        
        // 如果正在查看的通知被删除，关闭模态框
        if (selectedNotification.value && selectedNotification.value.id === notificationId) {
          closeDetailModal();
        }
      }
    };
    
    const deleteAllNotifications = () => {
      if (confirm('确定要清空所有通知吗？此操作不可撤销！')) {
        // 在实际项目中，这里应该调用API清空所有通知
        notifications.value = [];
        closeDetailModal();
      }
    };
    
    const viewRelatedFlight = (flightId) => {
      closeDetailModal();
      router.push(`/flight-detail/${flightId}`);
    };
    
    const viewRelatedOrder = (orderId) => {
      closeDetailModal();
      router.push(`/booking-detail/${orderId}`);
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
    
    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
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
    
    const formatTimeAgo = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) {
        return `${diffInSeconds}秒前`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}分钟前`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}小时前`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}天前`;
      } else {
        return formatDate(dateString);
      }
    };
    
    const formatPrice = (price) => {
      if (price === undefined || price === null) return '0.00';
      return price.toFixed(2);
    };
    
    const getNotificationIcon = (type) => {
      const icons = {
        'system': '📢',
        'flight': '✈️',
        'order': '💼'
      };
      return icons[type] || '📬';
    };
    
    const getNotificationTypeText = (type) => {
      const typeTexts = {
        'system': '系统通知',
        'flight': '航班通知',
        'order': '订单通知'
      };
      return typeTexts[type] || '通知';
    };
    
    const getEmptyStateText = () => {
      if (searchQuery.value) {
        return '没有找到匹配的通知';
      }
      
      switch (activeTab.value) {
        case 'unread':
          return '暂无未读通知';
        case 'system':
          return '暂无系统通知';
        case 'flight':
          return '暂无航班通知';
        case 'order':
          return '暂无订单通知';
        default:
          return '暂无通知';
      }
    };
    
    onMounted(() => {
      fetchNotifications();
    });
    
    return {
      loading,
      error,
      notifications,
      activeTab,
      searchQuery,
      showDetailModal,
      selectedNotification,
      totalNotifications,
      unreadCount,
      systemCount,
      flightCount,
      orderCount,
      hasUnreadNotifications,
      filteredNotifications,
      fetchNotifications,
      switchTab,
      handleSearch,
      viewNotification,
      closeDetailModal,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
      viewRelatedFlight,
      viewRelatedOrder,
      formatDate,
      formatDateTime,
      formatTimeAgo,
      formatPrice,
      getNotificationIcon,
      getNotificationTypeText,
      getEmptyStateText
    };
  }
});
</script>

<style scoped>
.notification-center-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.mark-all-read-button, .delete-all-button {
  padding: 8px 16px;
  border: 1px solid #bdc3c7;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.mark-all-read-button:hover:not(:disabled) {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.delete-all-button:hover:not(:disabled) {
  background-color: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.mark-all-read-button:disabled, .delete-all-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 1200px;
  margin: 0 auto;
}

.notification-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 20px;
  border: 1px solid #ecf0f1;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.tab-button:hover {
  border-color: #3498db;
  color: #3498db;
}

.tab-button.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.badge {
  background-color: #95a5a6;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
}

.badge.unread {
  background-color: #e74c3c;
}

.search-filter {
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  overflow: hidden;
  max-width: 400px;
}

.search-box input {
  flex: 1;
  border: none;
  padding: 10px 16px;
  outline: none;
  font-size: 14px;
}

.search-button {
  background: none;
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  color: #7f8c8d;
}

.search-button:hover {
  color: #3498db;
}

.notification-list {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background-color: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.empty-icon::before {
  content: '📭';
}

.notification-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f8ff;
  border-left: 4px solid #3498db;
}

.notification-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.notification-icon.system {
  background-color: #e3f2fd;
}

.notification-icon.flight {
  background-color: #e8f5e9;
}

.notification-icon.order {
  background-color: #fff3e0;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  color: #2c3e50;
  margin: 0;
  font-size: 16px;
}

.notification-time {
  color: #7f8c8d;
  font-size: 12px;
  white-space: nowrap;
}

.notification-message {
  color: #2c3e50;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.related-info {
  padding-top: 10px;
  border-top: 1px solid #ecf0f1;
  font-size: 13px;
}

.flight-info, .order-info {
  display: flex;
  gap: 15px;
  color: #7f8c8d;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}

.mark-read-button, .delete-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mark-read-button {
  background-color: #f1c40f;
  color: white;
}

.mark-read-button:hover {
  background-color: #f39c12;
}

.delete-button {
  background-color: #ecf0f1;
  color: #7f8c8d;
}

.delete-button:hover {
  background-color: #e74c3c;
  color: white;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.notification-type {
  background-color: #ecf0f1;
  color: #7f8c8d;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  align-self: flex-start;
}

.detail-content {
  margin-bottom: 20px;
}

.detail-message {
  color: #2c3e50;
  line-height: 1.6;
  margin-bottom: 20px;
}

.detail-related-info h4 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
}

.flight-detail-info, .order-detail-info {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ecf0f1;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #7f8c8d;
  font-size: 14px;
}

.info-row .value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.view-flight-button, .view-order-button {
  margin-top: 15px;
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.view-flight-button:hover, .view-order-button:hover {
  background-color: #2980b9;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px 24px;
  border-top: 1px solid #ecf0f1;
}

.close-modal-button, .mark-read-modal-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.close-modal-button {
  background-color: #7f8c8d;
  color: white;
}

.close-modal-button:hover {
  background-color: #6c757d;
}

.mark-read-modal-button {
  background-color: #f1c40f;
  color: white;
}

.mark-read-modal-button:hover {
  background-color: #f39c12;
}

@media (max-width: 768px) {
  .notification-center-container {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .notification-tabs {
    justify-content: center;
  }
  
  .tab-button {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .search-box {
    max-width: none;
  }
  
  .notification-item {
    flex-direction: column;
    padding: 15px;
  }
  
  .notification-icon {
    align-self: flex-start;
  }
  
  .notification-actions {
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 10px;
  }
  
  .flight-info, .order-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .modal-content {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .close-modal-button, .mark-read-modal-button {
    width: 100%;
  }
}
</style>