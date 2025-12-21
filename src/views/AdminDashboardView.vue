<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Trang quản lý hệ thống</h1>
      <button @click="handleLogout" class="btn-logout">Đăng xuất</button>
    </div>
    
    <div class="dashboard-content">
      <div class="sidebar">
        <nav class="nav-menu">
          <button 
            @click="activeTab = 'users'" 
            :class="['nav-item', { active: activeTab === 'users' }]"
          >
            Tài khoản người dùng
          </button>
          <button 
            @click="activeTab = 'documents'" 
            :class="['nav-item', { active: activeTab === 'documents' }]"
          >
            Tài liệu
          </button>
          <button 
            @click="activeTab = 'courses'" 
            :class="['nav-item', { active: activeTab === 'courses' }]"
          >
            Khóa học
          </button>
          <button 
            @click="activeTab = 'posts'" 
            :class="['nav-item', { active: activeTab === 'posts' }]"
          >
            Bài viết
          </button>
          <button 
            @click="activeTab = 'forum'" 
            :class="['nav-item', { active: activeTab === 'forum' }]"
          >
            Diễn đàn
          </button>
        </nav>
      </div>
      
      <div class="main-content">
        <UsersManagement v-if="activeTab === 'users'" />
        <DocumentsManagement v-if="activeTab === 'documents'" />
        <CoursesManagement v-if="activeTab === 'courses'" />
        <BlogPostsManagement v-if="activeTab === 'posts'" />
        <ForumManagement v-if="activeTab === 'forum'" />
      </div>
    </div>
  </div>
</template>

<script>
import UsersManagement from '@/components/admin/UsersManagement.vue'
import DocumentsManagement from '@/components/admin/DocumentsManagement.vue'
import CoursesManagement from '@/components/admin/CoursesManagement.vue'
import BlogPostsManagement from '@/components/admin/BlogPostsManagement.vue'
import ForumManagement from '@/components/admin/ForumManagement.vue'

export default {
  name: 'AdminDashboardView',
  components: {
    UsersManagement,
    DocumentsManagement,
    CoursesManagement,
    BlogPostsManagement,
    ForumManagement
  },
  data() {
    return {
      activeTab: 'users'
    }
  },
  mounted() {
    // Kiểm tra quyền admin
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('userRole')
    
    if (!token || role !== 'admin') {
      this.$router.push('/administrator')
    }
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userFullName')
      localStorage.removeItem('isLoggedIn')
      this.$router.push('/administrator')
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.dashboard-header {
  background: white;
  padding: 20px 30px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: normal;
  color: #333;
}

.btn-logout {
  padding: 8px 16px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-logout:hover {
  background-color: #555;
}

.dashboard-content {
  display: flex;
  height: calc(100vh - 80px);
}

.sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #ddd;
  padding: 20px 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
}

.nav-item {
  padding: 15px 30px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #f5f5f5;
}

.nav-item.active {
  background-color: #f5f5f5;
  color: #333;
  border-left-color: #333;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}
</style>

