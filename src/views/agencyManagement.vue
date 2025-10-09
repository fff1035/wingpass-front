<template>
  <div class="airline-management-container">
    <div class="header">
      <h1>航空公司管理</h1>
      <div class="header-actions">
        <button class="add-button" @click="showAddAirlineModal">添加航空公司</button>
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索航空公司名称或联系人"
            @input="handleSearch"
          />
          <button class="search-button">🔍</button>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载航空公司信息中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchAirlines" class="retry-button">重试</button>
    </div>
    
    <div v-else class="main-content">
      <div class="airline-stats">
        <div class="stat-card">
          <div class="stat-number">{{ totalAirlines }}</div>
          <div class="stat-label">航空公司总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ activeAirlines }}</div>
          <div class="stat-label">活跃航空公司</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ pendingAirlines }}</div>
          <div class="stat-label">待审核</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ suspendedAirlines }}</div>
          <div class="stat-label">已暂停</div>
        </div>
      </div>
      
      <div class="agency-filters">
        <select v-model="statusFilter" @change="applyFilters">
          <option value="all">全部状态</option>
          <option value="active">活跃</option>
          <option value="pending">待审核</option>
          <option value="suspended">已暂停</option>
        </select>
        <select v-model="sortBy" @change="applyFilters">
          <option value="name">按名称排序</option>
          <option value="createdAt">按创建时间排序</option>
          <option value="bookingCount">按预订量排序</option>
        </select>
        <select v-model="sortOrder" @change="applyFilters">
          <option value="asc">升序</option>
          <option value="desc">降序</option>
        </select>
      </div>
      
      <div class="airline-list">
        <div v-if="filteredAirlines.length === 0" class="empty-state">
          <p>暂无符合条件的航空公司</p>
        </div>
        
        <div v-else class="airline-grid">
          <div v-for="airline in filteredAirlines" :key="airline.id" class="airline-card">
            <div class="airline-header">
              <h3>{{ airline.name }}</h3>
              <span class="status-badge status-{{ airline.status }}">{{ getStatusText(airline.status) }}</span>
            </div>
            
            <div class="airline-info">
              <div class="info-row">
                <span class="label">联系人:</span>
                <span class="value">{{ airline.contactPerson }}</span>
              </div>
              <div class="info-row">
                <span class="label">联系电话:</span>
                <span class="value">{{ airline.phone }}</span>
              </div>
              <div class="info-row">
                <span class="label">邮箱:</span>
                <span class="value">{{ airline.email }}</span>
              </div>
              <div class="info-row">
                <span class="label">地址:</span>
                <span class="value">{{ airline.address }}</span>
              </div>
              <div class="info-row">
                <span class="label">创建时间:</span>
                <span class="value">{{ formatDate(airline.createdAt) }}</span>
              </div>
              <div class="info-row">
                <span class="label">最近订单:</span>
                <span class="value">{{ airline.lastOrderDate ? formatDate(airline.lastOrderDate) : '暂无' }}</span>
              </div>
              <div class="info-row">
                <span class="label">累计订单:</span>
                <span class="value">{{ airline.bookingCount }} 单</span>
              </div>
              <div class="info-row">
                <span class="label">佣金比例:</span>
                <span class="value">{{ airline.commissionRate }}%</span>
              </div>
            </div>
            
            <div class="airline-actions">
              <button class="view-button" @click="viewAirlineDetail(airline.id)">查看详情</button>
              <button v-if="airline.status === 'pending'" class="approve-button" @click="approveAirline(airline.id)">通过审核</button>
              <button v-if="airline.status === 'active'" class="suspend-button" @click="suspendAirline(airline.id)">暂停合作</button>
              <button v-if="airline.status === 'suspended'" class="activate-button" @click="activateAirline(airline.id)">恢复合作</button>
              <button class="edit-button" @click="showEditAirlineModal(airline)">编辑</button>
              <button class="delete-button" @click="deleteAirline(airline.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pagination" v-if="totalPages > 1">
        <button 
          class="page-button" 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          上一页
        </button>
        
        <button 
          v-for="page in visiblePages" 
          :key="page"
          class="page-button" 
          :class="{ active: page === currentPage }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        
        <button 
          class="page-button" 
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
    
    <!-- 添加/编辑航空公司模态框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingAirline ? '编辑航空公司' : '添加航空公司' }}</h2>
          <button class="close-button" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>航空公司名称 *</label>
              <input 
                type="text" 
                v-model="formData.name"
                required
                placeholder="请输入航空公司名称"
              />
            </div>
            
            <div class="form-group">
              <label>联系人 *</label>
              <input 
                type="text" 
                v-model="formData.contactPerson"
                required
                placeholder="请输入联系人姓名"
              />
            </div>
            
            <div class="form-group">
              <label>联系电话 *</label>
              <input 
                type="tel" 
                v-model="formData.phone"
                required
                placeholder="请输入联系电话"
              />
            </div>
            
            <div class="form-group">
              <label>邮箱 *</label>
              <input 
                type="email" 
                v-model="formData.email"
                required
                placeholder="请输入邮箱地址"
              />
            </div>
            
            <div class="form-group">
              <label>地址</label>
              <input 
                type="text" 
                v-model="formData.address"
                placeholder="请输入航空公司地址"
              />
            </div>
            
            <div class="form-group">
              <label>佣金比例 (%) *</label>
              <input 
                type="number" 
                v-model.number="formData.commissionRate"
                required
                min="0"
                max="50"
                step="0.1"
                placeholder="请输入佣金比例"
              />
            </div>
            
            <div class="form-group" v-if="editingAgency">
              <label>状态</label>
              <select v-model="formData.status">
                <option value="active">活跃</option>
                <option value="pending">待审核</option>
                <option value="suspended">已暂停</option>
              </select>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-button" @click="closeModal">取消</button>
          <button class="submit-button" @click="handleSubmit">{{ editingAgency ? '保存' : '添加' }}</button>
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
  name: 'AirlineManagement',
  setup() {
    const store = useStore();
    const router = useRouter();
    
    const loading = ref(true);
    const error = ref(null);
    const airlines = ref([]);
    const searchQuery = ref('');
    const statusFilter = ref('all');
    const sortBy = ref('name');
    const sortOrder = ref('asc');
    const currentPage = ref(1);
    const itemsPerPage = ref(10);
    
    // 模态框相关状态
    const showModal = ref(false);
    const editingAirline = ref(null);
    const formData = ref({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      commissionRate: 0,
      status: 'pending'
    });
    
    const totalAirlines = computed(() => airlines.value.length);
    
    const activeAirlines = computed(() => {
      return airlines.value.filter(a => a.status === 'active').length;
    });
    
    const pendingAirlines = computed(() => {
      return airlines.value.filter(a => a.status === 'pending').length;
    });
    
    const suspendedAirlines = computed(() => {
      return airlines.value.filter(a => a.status === 'suspended').length;
    });
    
    const filteredAirlines = computed(() => {
      let filtered = [...airlines.value];
      
      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(a => 
          a.name.toLowerCase().includes(query) || 
          a.contactPerson.toLowerCase().includes(query) ||
          a.phone.includes(query) ||
          a.email.toLowerCase().includes(query)
        );
      }
      
      // 状态过滤
      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(a => a.status === statusFilter.value);
      }
      
      // 排序
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy.value) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt) - new Date(b.createdAt);
            break;
          case 'bookingCount':
            comparison = a.bookingCount - b.bookingCount;
            break;
        }
        
        return sortOrder.value === 'desc' ? comparison * -1 : comparison;
      });
      
      // 分页
      const startIndex = (currentPage.value - 1) * itemsPerPage.value;
      const endIndex = startIndex + itemsPerPage.value;
      return filtered.slice(startIndex, endIndex);
    });
    
    const totalPages = computed(() => {
      let filtered = [...airlines.value];
      
      // 应用搜索和状态过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(a => 
          a.name.toLowerCase().includes(query) || 
          a.contactPerson.toLowerCase().includes(query) ||
          a.phone.includes(query) ||
          a.email.toLowerCase().includes(query)
        );
      }
      
      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(a => a.status === statusFilter.value);
      }
      
      return Math.ceil(filtered.length / itemsPerPage.value);
    });
    
    const visiblePages = computed(() => {
      const maxVisiblePages = 5;
      const pages = [];
      let start = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages.value, start + maxVisiblePages - 1);
      
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    });
    
    const fetchAirlines = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // 由于没有实际的航空公司管理API，我们模拟数据
        // 实际项目中应该调用后端API获取航空公司列表
        airlines.value = generateMockAirlines();
      } catch (err) {
        error.value = err.message || '获取航空公司信息失败';
        console.error('获取航空公司信息错误:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const generateMockAirlines = () => {
      const mockAirlines = [];
      const statuses = ['active', 'pending', 'suspended'];
      const names = [
        '中国国际航空', '东方航空', '南方航空', '海南航空', '深圳航空',
        '厦门航空', '四川航空', '山东航空', '春秋航空', '吉祥航空',
        '首都航空', '天津航空', '云南祥鹏航空', '奥凯航空', '西部航空',
        '华夏航空', '幸福航空', '九元航空', '成都航空', '昆明航空'
      ];
      const contactPersons = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
      
      for (let i = 1; i <= 20; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 365));
        
        const lastOrderDate = Math.random() > 0.2 ? new Date(createdAt) : null;
        if (lastOrderDate) {
          lastOrderDate.setDate(lastOrderDate.getDate() + Math.floor(Math.random() * (new Date() - createdAt) / 86400000));
        }
        
        mockAirlines.push({
          id: `airline_${i}`,
          name: names[i - 1],
          contactPerson: contactPersons[Math.floor(Math.random() * contactPersons.length)],
          phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          email: `contact${i}@example.com`,
          address: `北京市朝阳区${i}号街道${i * 10}号`,
          status: status,
          createdAt: createdAt.toISOString(),
          lastOrderDate: lastOrderDate ? lastOrderDate.toISOString() : null,
          bookingCount: Math.floor(Math.random() * 1000),
          commissionRate: 5 + Math.random() * 10,
          isVerified: status === 'active',
          totalRevenue: Math.floor(Math.random() * 1000000)
        });
      }
      
      return mockAirlines;
    };
    
    const getStatusText = (status) => {
      const statusTexts = {
        'active': '活跃',
        'pending': '待审核',
        'suspended': '已暂停'
      };
      return statusTexts[status] || status;
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
    
    const handleSearch = () => {
      currentPage.value = 1;
    };
    
    const applyFilters = () => {
      currentPage.value = 1;
    };
    
    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
      }
    };
    
    const showAddAirlineModal = () => {
      editingAirline.value = null;
      formData.value = {
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        commissionRate: 0,
        status: 'pending'
      };
      showModal.value = true;
    };
    
    const showEditAirlineModal = (airline) => {
      editingAirline.value = airline;
      formData.value = {
        name: airline.name,
        contactPerson: airline.contactPerson,
        phone: airline.phone,
        email: airline.email,
        address: airline.address,
        commissionRate: airline.commissionRate,
        status: airline.status
      };
      showModal.value = true;
    };
    
    const closeModal = () => {
      showModal.value = false;
      editingAirline.value = null;
    };
    
    const handleSubmit = () => {
      // 在实际项目中，这里应该调用API保存航空公司信息
      if (editingAirline.value) {
        // 编辑现有航空公司
        const index = airlines.value.findIndex(a => a.id === editingAirline.value.id);
        if (index !== -1) {
          airlines.value[index] = {
            ...airlines.value[index],
            ...formData.value
          };
        }
        alert('航空公司信息已更新');
      } else {
        // 添加新航空公司
        const newAirline = {
          id: `airline_${Date.now()}`,
          ...formData.value,
          createdAt: new Date().toISOString(),
          lastOrderDate: null,
          bookingCount: 0,
          isVerified: formData.value.status === 'active',
          totalRevenue: 0
        };
        airlines.value.unshift(newAirline);
        alert('航空公司已添加成功');
      }
      closeModal();
    };
    
    const viewAirlineDetail = (airlineId) => {
      // 在实际项目中，这里应该导航到航空公司详情页面
      alert(`查看航空公司详情: ${airlineId}`);
    };
    
    const approveAirline = (airlineId) => {
      if (confirm('确定要通过该航空公司的审核吗？')) {
        const airline = airlines.value.find(a => a.id === airlineId);
        if (airline) {
          airline.status = 'active';
          airline.isVerified = true;
          alert('航空公司已通过审核');
        }
      }
    };
    
    const suspendAirline = (airlineId) => {
      if (confirm('确定要暂停该航空公司的合作吗？')) {
        const airline = airlines.value.find(a => a.id === airlineId);
        if (airline) {
          airline.status = 'suspended';
          alert('航空公司已暂停合作');
        }
      }
    };
    
    const activateAirline = (airlineId) => {
      if (confirm('确定要恢复该航空公司的合作吗？')) {
        const airline = airlines.value.find(a => a.id === airlineId);
        if (airline) {
          airline.status = 'active';
          airline.isVerified = true;
          alert('航空公司合作已恢复');
        }
      }
    };
    
    const deleteAirline = (airlineId) => {
      if (confirm('确定要删除该航空公司吗？此操作不可撤销！')) {
        airlines.value = airlines.value.filter(a => a.id !== airlineId);
        alert('航空公司已删除');
      }
    };
    
    onMounted(() => {
      fetchAirlines();
    });
    
    return {
      loading,
      error,
      airlines,
      searchQuery,
      statusFilter,
      sortBy,
      sortOrder,
      currentPage,
      showModal,
      editingAirline,
      formData,
      totalAirlines,
      activeAirlines,
      pendingAirlines,
      suspendedAirlines,
      filteredAirlines,
      totalPages,
      visiblePages,
      fetchAirlines,
      getStatusText,
      formatDate,
      handleSearch,
      applyFilters,
      changePage,
      showAddAirlineModal,
      showEditAirlineModal,
      closeModal,
      handleSubmit,
      viewAirlineDetail,
      approveAirline,
      suspendAirline,
      activateAirline,
      deleteAirline
    };
  }
});
</script>

<style scoped>
.airline-management-container {
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
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.add-button {
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.add-button:hover {
  background-color: #229954;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  overflow: hidden;
}

.search-box input {
  border: none;
  padding: 8px 16px;
  outline: none;
  font-size: 14px;
  width: 200px;
}

.search-button {
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  color: #7f8c8d;
}

.search-button:hover {
  color: #3498db;
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

.airline-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.airline-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.airline-filters select {
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.airline-list {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.airline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .airline-grid {
    grid-template-columns: 1fr;
  }
}

.airline-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 20px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.airline-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.airline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.airline-header h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 18px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.status-active {
  background-color: #27ae60;
}

.status-pending {
  background-color: #f39c12;
}

.status-suspended {
  background-color: #e74c3c;
}

.airline-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #7f8c8d;
}

.value {
  color: #2c3e50;
  font-weight: 500;
}

.airline-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.view-button, .approve-button, .suspend-button, .activate-button, .edit-button, .delete-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.view-button {
  background-color: #3498db;
  color: white;
}

.view-button:hover {
  background-color: #2980b9;
}

.approve-button {
  background-color: #27ae60;
  color: white;
}

.approve-button:hover {
  background-color: #229954;
}

.suspend-button {
  background-color: #f39c12;
  color: white;
}

.suspend-button:hover {
  background-color: #e67e22;
}

.activate-button {
  background-color: #9b59b6;
  color: white;
}

.activate-button:hover {
  background-color: #8e44ad;
}

.edit-button {
  background-color: #f1c40f;
  color: white;
}

.edit-button:hover {
  background-color: #f39c12;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
}

.delete-button:hover {
  background-color: #c0392b;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.page-button {
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.page-button:hover:not(:disabled) {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.page-button.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.page-button:disabled {
  opacity: 0.5;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
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
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.form-group input:focus, .form-group select:focus {
  border-color: #3498db;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid #ecf0f1;
}

.cancel-button, .submit-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.cancel-button {
  background-color: #7f8c8d;
  color: white;
}

.cancel-button:hover {
  background-color: #6c757d;
}

.submit-button {
  background-color: #3498db;
  color: white;
}

.submit-button:hover {
  background-color: #2980b9;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .search-box input {
    width: 150px;
  }
  
  .airline-filters {
    justify-content: space-between;
  }
  
  .airline-actions {
    justify-content: center;
  }
  
  .modal-content {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .cancel-button, .submit-button {
    width: 100%;
  }
}
</style>