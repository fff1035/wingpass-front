<template>
  <div class="flight-detail-container">
    <!-- 页面头部 -->
    <div class="header">
      <div class="header-content">
        <button class="back-button" @click="goBack" aria-label="返回">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1>航班详情</h1>
        <div class="header-right"></div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载航班信息中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchFlightDetail" class="retry-button">重试</button>
    </div>
    
    <!-- 航班内容 -->
    <div v-else-if="flightDetail" class="flight-content">
      <!-- 航班头部信息 -->
      <div class="flight-header">
        <div class="flight-info">
          <div class="flight-basic-info">
            <div class="flight-main-info">
              <h2>{{ flightDetail.flightNumber }}</h2>
              <div class="airline">
                <span class="airline-icon">{{ getAirlineIcon(flightDetail.flightNumber) }}</span>
                {{ getAirlineName(flightDetail.flightNumber) }}
              </div>
            </div>
            
            <div class="flight-route">
              <div class="airport-info origin">
                <div class="airport-code">{{ flightDetail.fromAirport }}</div>
                <div class="airport-name">{{ getAirportName(flightDetail.fromAirport) }}</div>
                <div class="date-time">
                  <div class="date">{{ formatDate(flightDetail.departureDate) }}</div>
                  <div class="time">{{ flightDetail.departureTime }}</div>
                </div>
              </div>
              
              <!-- 路线可视化 -->
              <div class="route-details">
                <div class="route-line">
                  <div class="line"></div>
                  <div class="airplane-icon" :class="{ animated: true }"></div>
                </div>
                <div class="route-meta">
                  <div class="duration">{{ flightDetail.flightDuration }}</div>
                  <div class="stops-info">
                    {{ flightDetail.stops === 0 ? '直飞' : `经停${flightDetail.stops}站` }}
                  </div>
                </div>
              </div>
              
              <div class="airport-info destination">
                <div class="airport-code">{{ flightDetail.toAirport }}</div>
                <div class="airport-name">{{ getAirportName(flightDetail.toAirport) }}</div>
                <div class="date-time">
                  <div class="date">{{ formatDate(flightDetail.arrivalDate) }}</div>
                  <div class="time">{{ flightDetail.arrivalTime }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 航班状态 -->
        <div class="flight-status">
          <div class="status-badge status-{{ flightDetail.status }}">
            <span class="status-dot"></span>
            {{ getStatusText(flightDetail.status) }}
          </div>
          <div v-if="flightDetail.status === 'delayed'" class="delay-info">
            延误至: {{ formatDate(flightDetail.newDepartureDate) }} {{ flightDetail.newDepartureTime }}
          </div>
        </div>
      </div>
      
      <!-- 航班详情板块 -->
      <div class="flight-sections">
        <!-- 航班信息板块 -->
        <div class="section card">
          <div class="section-header">
            <h3>航班信息</h3>
            <div class="section-icon">✈️</div>
          </div>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">飞机型号:</span>
                <span class="value">{{ flightDetail.aircraftType || '波音737-800' }}</span>
              </div>
              <div class="info-item">
                <span class="label">机龄:</span>
                <span class="value">{{ flightDetail.aircraftAge || '3年' }}</span>
              </div>
              <div class="info-item">
                <span class="label">航班距离:</span>
                <span class="value">{{ flightDetail.distance || '1200公里' }}</span>
              </div>
              <div class="info-item">
                <span class="label">准点率:</span>
                <span class="value">{{ flightDetail.onTimeRate || '85%' }}</span>
              </div>
              <div class="info-item">
                <span class="label">经济舱座位:</span>
                <span class="value">{{ flightDetail.economySeats || '150' }}</span>
              </div>
              <div class="info-item">
                <span class="label">商务舱座位:</span>
                <span class="value">{{ flightDetail.businessSeats || '16' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 票价信息板块 -->
        <div class="section card">
          <div class="section-header">
            <h3>票价信息</h3>
            <div class="section-icon">💰</div>
          </div>
          <div class="section-content">
            <div class="price-list">
              <div v-for="classInfo in flightDetail.fareClasses" :key="classInfo.classType" class="price-item">
                <div class="class-info">
                  <div class="class-type">{{ getClassTypeText(classInfo.classType) }}</div>
                  <div class="class-desc">{{ classInfo.description }}</div>
                </div>
                <div class="price-info">
                  <div class="price">¥{{ classInfo.price }}</div>
                  <div class="seats-available">
                    <span class="seats-icon">💺</span>
                    余票: {{ classInfo.availableSeats }}
                  </div>
                  <button class="book-button primary-btn" @click="handleBook(classInfo.classType)" :class="{ 'book-now': true }">
                    立即预订
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 乘机须知板块 -->
        <div class="section card">
          <div class="section-header">
            <h3>乘机须知</h3>
            <div class="section-icon">📋</div>
          </div>
          <div class="section-content">
            <div class="notice-list">
              <div class="notice-item">
                <div class="notice-icon">🔄</div>
                <div class="notice-content">
                  <div class="notice-title">值机柜台</div>
                  <p>请前往{{ flightDetail.checkinCounter || '1-10号' }}柜台办理值机手续</p>
                </div>
              </div>
              <div class="notice-item">
                <div class="notice-icon">🧳</div>
                <div class="notice-content">
                  <div class="notice-title">行李额度</div>
                  <p>经济舱免费托运行李额度为20公斤，商务舱为30公斤</p>
                </div>
              </div>
              <div class="notice-item">
                <div class="notice-icon">🚪</div>
                <div class="notice-content">
                  <div class="notice-title">登机口</div>
                  <p>登机口将于航班起飞前30分钟关闭，请提前到达{{ flightDetail.gate || 'Gate 15' }}</p>
                </div>
              </div>
              <div class="notice-item">
                <div class="notice-icon">🍽️</div>
                <div class="notice-content">
                  <div class="notice-title">餐食</div>
                  <p>{{ flightDetail.meal ? '航班提供餐食服务' : '短途航班，不提供餐食' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 目的地天气板块 -->
        <div v-if="flightDetail.weatherInfo" class="section card weather-card">
          <div class="section-header">
            <h3>目的地天气</h3>
            <div class="section-icon">🌤️</div>
          </div>
          <div class="section-content">
            <div class="weather-info">
              <div class="weather-icon">{{ getWeatherIcon(flightDetail.weatherInfo.condition) }}</div>
              <div class="weather-details">
                <div class="weather-temp">{{ flightDetail.weatherInfo.temperature }}°C</div>
                <div class="weather-desc">{{ flightDetail.weatherInfo.condition }}</div>
                <div class="weather-other">{{ flightDetail.weatherInfo.wind }} · {{ flightDetail.weatherInfo.humidity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部操作按钮 -->
      <div class="bottom-actions">
        <button class="book-button primary-btn" @click="handleBook(flightDetail.fareClasses[0].classType)">
          <span class="book-icon">📝</span>
          预订此航班
        </button>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">✈️</div>
      <p>未找到航班信息</p>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default defineComponent({
  name: 'FlightDetail',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    const flightId = route.params.id;
    
    const loading = ref(true);
    const error = ref(null);
    const flightDetail = ref(null);
    
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
      'scheduled': '计划起飞',
      'delayed': '延误',
      'cancelled': '取消',
      'departed': '已起飞',
      'arrived': '已到达'
    };
    
    const classTypeTexts = {
      'economy': '经济舱',
      'premium_economy': '超级经济舱',
      'business': '商务舱',
      'first': '头等舱'
    };
    
    const airlineNames = {
      'CA': '中国国际航空',
      'MU': '东方航空',
      'CZ': '南方航空',
      'HU': '海南航空',
      'ZH': '深圳航空',
      'SC': '山东航空',
      '3U': '四川航空',
      'MF': '厦门航空',
      'BK': '奥凯航空',
      '9C': '春秋航空'
    };
    
    const airlineIcons = {
      'CA': '🇨🇳',
      'MU': '✈️',
      'CZ': '✈️',
      'HU': '✈️',
      'ZH': '✈️',
      'SC': '✈️',
      '3U': '✈️',
      'MF': '✈️',
      'BK': '✈️',
      '9C': '✈️'
    };
    
    const weatherIcons = {
      '晴朗': '☀️',
      '多云': '⛅',
      '阴天': '☁️',
      '小雨': '🌦️',
      '中雨': '🌧️',
      '大雨': '⛈️',
      '雪': '❄️',
      '雾': '🌫️'
    };
    
    const fetchFlightDetail = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // 由于没有专门的获取航班详情的API，我们模拟航班详情数据
        // 实际项目中应该调用专门的航班详情API
        flightDetail.value = generateMockFlightDetail(flightId);
      } catch (err) {
        error.value = err.message || '获取航班信息失败';
        console.error('获取航班详情错误:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const generateMockFlightDetail = (flightId) => {
      const flightNumbers = ['CA1234', 'MU5678', 'CZ3456', 'HU7890', 'ZH9012'];
      const fromAirports = ['PEK', 'SHA', 'CAN', 'SZX', 'CTU'];
      const toAirports = ['SHA', 'PEK', 'SZX', 'CAN', 'KMG'];
      const statuses = ['scheduled', 'delayed'];
      const aircraftTypes = ['波音737-800', '空客A320', '波音787-9', '空客A330', '空客A350'];
      
      // 根据flightId生成相对应的航班数据
      const seed = flightId ? parseInt(flightId) % flightNumbers.length : Math.floor(Math.random() * flightNumbers.length);
      const flightNumber = flightNumbers[seed];
      const fromAirport = fromAirports[seed];
      const toAirport = toAirports[seed];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const aircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
      
      // 生成日期
      const today = new Date();
      const departureDate = new Date(today);
      departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 7));
      const arrivalDate = new Date(departureDate);
      
      // 生成时间
      const departureHour = Math.floor(Math.random() * 12) + 6;
      const departureMinute = Math.random() > 0.5 ? 0 : 30;
      departureDate.setHours(departureHour, departureMinute, 0);
      
      // 生成飞行时长（2-5小时）
      const durationHours = Math.floor(Math.random() * 4) + 2;
      const durationMinutes = Math.random() > 0.5 ? 0 : 30;
      arrivalDate.setHours(departureDate.getHours() + durationHours, departureDate.getMinutes() + durationMinutes, 0);
      
      // 格式化时间字符串
      const formatTime = (date) => {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
      };
      
      return {
        id: flightId || '1001',
        flightNumber: flightNumber,
        fromAirport: fromAirport,
        toAirport: toAirport,
        departureDate: departureDate.toISOString().split('T')[0],
        departureTime: formatTime(departureDate),
        arrivalDate: arrivalDate.toISOString().split('T')[0],
        arrivalTime: formatTime(arrivalDate),
        flightDuration: `${durationHours}小时${durationMinutes}分钟`,
        stops: 0,
        status: status,
        
        // 延误信息
        newDepartureDate: status === 'delayed' ? 
          new Date(departureDate.getTime() + 3600000).toISOString().split('T')[0] : null,
        newDepartureTime: status === 'delayed' ? 
          formatTime(new Date(departureDate.getTime() + 3600000)) : null,
        
        // 飞机信息
        aircraftType: aircraftType,
        aircraftAge: `${Math.floor(Math.random() * 5) + 1}年`,
        distance: `${Math.floor(Math.random() * 1000) + 800}公里`,
        onTimeRate: `${80 + Math.floor(Math.random() * 15)}%`,
        economySeats: 150,
        businessSeats: 16,
        
        // 票价信息
        fareClasses: [
          {
            classType: 'economy',
            description: '标准经济舱',
            price: 1200 + Math.floor(Math.random() * 800),
            availableSeats: Math.floor(Math.random() * 50) + 10
          },
          {
            classType: 'premium_economy',
            description: '超级经济舱',
            price: 2000 + Math.floor(Math.random() * 1000),
            availableSeats: Math.floor(Math.random() * 20) + 5
          },
          {
            classType: 'business',
            description: '商务舱',
            price: 4000 + Math.floor(Math.random() * 2000),
            availableSeats: Math.floor(Math.random() * 10) + 2
          }
        ],
        
        // 乘机须知
        checkinCounter: '1-10号',
        gate: `Gate ${Math.floor(Math.random() * 30) + 1}`,
        meal: true,
        
        // 天气信息
        weatherInfo: {
          condition: ['晴朗', '多云', '阴天', '小雨'][Math.floor(Math.random() * 4)],
          temperature: Math.floor(Math.random() * 30) + 10,
          wind: '东北风 3-4级',
          humidity: '60%'
        }
      };
    };
    
    const getAirportName = (code) => {
      return airportNames[code] || code;
    };
    
    const getStatusText = (status) => {
      return statusTexts[status] || status;
    };
    
    const getClassTypeText = (classType) => {
      return classTypeTexts[classType] || classType;
    };
    
    const getAirlineName = (flightNumber) => {
      const airlineCode = flightNumber.substring(0, flightNumber.length > 2 ? 2 : 1);
      return airlineNames[airlineCode] || '未知航空公司';
    };
    
    const getWeatherIcon = (condition) => {
      return weatherIcons[condition] || '🌤️';
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        weekday: 'short'
      });
    };
    
    const handleBook = (classType) => {
      router.push({ 
        name: 'booking', 
        query: {
          flightId: flightDetail.value.id,
          from: flightDetail.value.fromAirport,
          to: flightDetail.value.toAirport,
          date: flightDetail.value.departureDate,
          classType: classType
        }
      });
    };
    
    const goBack = () => {
      router.go(-1);
    };
    
    onMounted(() => {
      fetchFlightDetail();
    });
    
    return {
      loading,
      error,
      flightDetail,
      flightId,
      fetchFlightDetail,
      getAirportName,
      getStatusText,
      getClassTypeText,
      getAirlineName,
      getWeatherIcon,
      formatDate,
      handleBook,
      goBack
    };
  }
});
</script>

<style scoped>
/* 全局样式变量 */
:root {
  --primary-color: #3498db;
  --primary-hover: #2980b9;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --info-color: #9b59b6;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --text-muted: #95a5a6;
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f5f7fa;
  --border-color: #ecf0f1;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
  --border-radius: 12px;
  --transition: all 0.3s ease;
}

/* 主容器 */
.flight-detail-container {
  min-height: 100vh;
  background-color: var(--bg-tertiary);
  background-image: linear-gradient(135deg, var(--bg-tertiary) 0%, #eef2f7 100%);
  padding: 0;
}

/* 页面头部 */
.header {
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.header h1 {
  color: var(--text-primary);
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-right {
  width: 20px;
}

/* 返回按钮 */
.back-button {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-button:hover {
  background-color: var(--bg-secondary);
}

/* 加载、错误和空状态 */
.loading-container, .error-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  min-height: calc(100vh - 64px);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: var(--danger-color);
  margin-bottom: 20px;
  font-size: 16px;
  max-width: 400px;
}

.retry-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
}

.retry-button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 航班内容 */
.flight-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* 航班头部信息 */
.flight-header {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.flight-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--info-color));
}

.flight-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.flight-main-info h2 {
  color: var(--text-primary);
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.airline {
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.airline-icon {
  font-size: 16px;
}

/* 航班路线 */
.flight-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  position: relative;
}

.airport-info {
  text-align: center;
  flex: 1;
  min-width: 180px;
  position: relative;
  z-index: 2;
}

.origin .airport-code {
  color: var(--primary-color);
}

.destination .airport-code {
  color: var(--info-color);
}

.airport-code {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.airport-name {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  font-weight: 500;
}

.date-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.date {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.time {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

/* 路线详情 */
.route-details {
  flex: 2;
  position: relative;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.route-line {
  position: relative;
  width: 100%;
  height: 4px;
  margin: 0 20px;
}

.line {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--info-color));
  transform: translateY(-50%);
}

.airplane-icon {
  position: absolute;
  top: 50%;
  left: 0;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: var(--primary-color);
  transition: var(--transition);
}

.airplane-icon.animated {
  animation: fly 5s linear infinite;
}

@keyframes fly {
  0% {
    left: 0;
    transform: translate(-50%, -50%);
  }
  5% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  95% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    left: 100%;
    transform: translate(50%, -50%);
  }
}

.route-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.duration {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

.stops-info {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 航班状态 */
.flight-status {
  flex: 1;
  text-align: center;
  min-width: 120px;
  padding: 0 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  color: white;
  transition: var(--transition);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.status-scheduled {
  background-color: var(--primary-color);
}

.status-delayed {
  background-color: var(--warning-color);
}

.status-cancelled {
  background-color: var(--danger-color);
}

.status-departed {
  background-color: var(--success-color);
}

.status-arrived {
  background-color: var(--info-color);
}

.delay-info {
  margin-top: 12px;
  font-size: 12px;
  color: var(--danger-color);
  font-weight: 500;
}

/* 航班详情板块 */
.flight-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 卡片式板块 */
.section.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.section.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.section-header h3 {
  color: var(--text-primary);
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.section-icon {
  font-size: 20px;
  opacity: 0.7;
}

.section-content {
  padding: 24px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  transition: var(--transition);
}

.info-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.info-item .label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item .value {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
}

/* 价格列表 */
.price-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
  transition: var(--transition);
  border: 2px solid transparent;
}

.price-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  border-color: var(--primary-color);
}

.class-info {
  flex: 1;
}

.class-type {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.class-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.price {
  font-size: 24px;
  font-weight: 700;
  color: var(--danger-color);
}

.seats-available {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.seats-icon {
  font-size: 14px;
}

/* 按钮样式 */
.book-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
}

.primary-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.book-now {
  padding: 12px 24px;
  font-size: 15px;
}

/* 通知列表 */
.notice-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.notice-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
  transition: var(--transition);
  border-left: 4px solid var(--primary-color);
}

.notice-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.notice-icon {
  font-size: 24px;
  flex-shrink: 0;
  opacity: 0.8;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.notice-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* 天气卡片 */
.weather-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.weather-card .section-header {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: none;
}

.weather-card .section-header h3 {
  color: white;
}

.weather-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 32px 24px;
}

.weather-icon {
  font-size: 80px;
  opacity: 0.9;
}

.weather-details {
  text-align: center;
}

.weather-temp {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -1px;
}

.weather-desc {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  opacity: 0.9;
}

.weather-other {
  font-size: 14px;
  opacity: 0.8;
}

/* 底部操作按钮 */
.bottom-actions {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
  max-width: 1200px;
  margin: 24px auto 0;
  border-radius: 12px 12px 0 0;
}

.bottom-actions .book-button {
  width: 100%;
  padding: 16px;
  font-size: 16px;
}

.book-icon {
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .flight-content {
    padding: 16px;
  }
  
  .flight-header {
    padding: 24px;
  }
  
  .flight-main-info h2 {
    font-size: 24px;
  }
  
  .airport-code {
    font-size: 32px;
  }
  
  .time {
    font-size: 20px;
  }
  
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .notice-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-content {
    height: 56px;
    padding: 0 16px;
  }
  
  .header h1 {
    font-size: 18px;
  }
  
  .flight-content {
    padding: 12px;
  }
  
  .flight-header {
    padding: 20px 16px;
  }
  
  .flight-route {
    flex-direction: column;
    gap: 32px;
  }
  
  .route-line {
    transform: rotate(90deg);
    width: 120px;
    margin: 20px 0;
  }
  
  .airplane-icon.animated {
    animation: fly-vertical 5s linear infinite;
  }
  
  @keyframes fly-vertical {
    0% {
      top: 0;
      transform: translate(-50%, -50%) rotate(90deg);
    }
    5% {
      transform: translate(-50%, -50%) rotate(90deg);
    }
    95% {
      transform: translate(-50%, -50%) rotate(90deg);
    }
    100% {
      top: 100%;
      transform: translate(-50%, 50%) rotate(90deg);
    }
  }
  
  .flight-status {
    position: absolute;
    top: 16px;
    right: 16px;
  }
  
  .section-content {
    padding: 16px;
  }
  
  .price-item {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .price-info {
    align-items: stretch;
    gap: 8px;
  }
  
  .book-now {
    width: 100%;
  }
  
  .weather-info {
    flex-direction: column;
    gap: 20px;
  }
  
  .weather-icon {
    font-size: 64px;
  }
  
  .weather-temp {
    font-size: 36px;
  }
  
  .bottom-actions {
    padding: 16px 12px;
  }
}

@media (max-width: 480px) {
  .flight-main-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .flight-status {
    position: static;
    margin-top: 16px;
  }
  
  .airport-code {
    font-size: 28px;
  }
  
  .time {
    font-size: 18px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .bottom-actions .book-button {
    padding: 14px;
    font-size: 15px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section.card {
  animation: fadeIn 0.5s ease-out;
}

.section.card:nth-child(2) {
  animation-delay: 0.1s;
}

.section.card:nth-child(3) {
  animation-delay: 0.2s;
}

.section.card:nth-child(4) {
  animation-delay: 0.3s;
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .airplane-icon.animated {
    animation: none;
    left: 50% !important;
  }
  
  .status-dot {
    animation: none;
  }
  
  .section.card {
    animation: none;
  }
  
  .book-button:hover,
  .retry-button:hover,
  .section.card:hover,
  .info-item:hover,
  .price-item:hover {
    transform: none;
  }
}
</style>