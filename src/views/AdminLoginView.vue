<template>
  <div class="admin-login-container">
    <div class="login-box">
      <h2>Đăng nhập quản trị viên</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input 
            type="email" 
            v-model="email" 
            required 
            placeholder="Nhập email"
            class="form-control"
          />
        </div>
        <div class="form-group">
          <label>Mật khẩu</label>
          <input 
            type="password" 
            v-model="password" 
            required 
            placeholder="Nhập mật khẩu"
            class="form-control"
          />
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { loginUser } from '@/utils/authAPI.js'

export default {
  name: 'AdminLoginView',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      errorMessage: ''
    }
  },
  mounted() {
    // Nếu đã đăng nhập và là admin, chuyển đến dashboard
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('userRole')
    if (token && role === 'admin') {
      this.$router.push('/administrator/manager-dashboard')
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.errorMessage = ''

      try {
        const result = await loginUser(this.email, this.password)
        
        if (result.success) {
          // Kiểm tra role
          const userRole = result.data?.user?.role || localStorage.getItem('userRole')
          
          if (userRole !== 'admin') {
            this.errorMessage = 'Bạn không có quyền truy cập trang quản trị'
            localStorage.removeItem('token')
            localStorage.removeItem('userRole')
            this.loading = false
            return
          }

          // Đăng nhập thành công, chuyển đến dashboard
          this.$router.push('/administrator/manager-dashboard')
        } else {
          this.errorMessage = result.message || 'Đăng nhập thất bại'
        }
      } catch (error) {
        console.error('Login error:', error)
        this.errorMessage = 'Có lỗi xảy ra khi đăng nhập'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.login-box h2 {
  margin: 0 0 30px 0;
  text-align: center;
  font-size: 24px;
  font-weight: normal;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #666;
}

.error-message {
  color: #d32f2f;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}

.btn-login {
  width: 100%;
  padding: 12px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.btn-login:hover:not(:disabled) {
  background-color: #555;
}

.btn-login:disabled {
  background-color: #999;
  cursor: not-allowed;
}
</style>

