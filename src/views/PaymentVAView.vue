<template>
  <div class="payment-va-page">
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <!-- Header -->
          <div class="text-center mb-4">
            <h1 class="mb-3">Thanh toán khóa học</h1>
            <p class="text-muted">Quét QR code hoặc chuyển khoản theo thông tin bên dưới</p>
          </div>

          <!-- Payment Info Card -->
          <div class="card shadow-sm mb-4">
            <div class="card-body p-4">
              <!-- Course Info -->
              <div class="mb-4 pb-4 border-bottom">
                <h5 class="mb-2">Thông tin khóa học</h5>
                <p class="mb-1"><strong>Tên khóa học:</strong> {{ courseTitle || 'Đang tải...' }}</p>
                <p class="mb-0"><strong>Số tiền:</strong> <span class="text-danger fw-bold">{{ formatPrice(amount) }} VND</span></p>
              </div>

              <!-- QR Code -->
              <div class="text-center mb-4">
                <h5 class="mb-3">Quét QR code để thanh toán</h5>
                <div v-if="qrCodeUrl" class="qr-code-container">
                  <img :src="qrCodeUrl" alt="QR Code" class="qr-code-img" />
                </div>
                <div v-else class="text-muted">
                  <p>Đang tải QR code...</p>
                </div>
              </div>

              <!-- VA Info -->
              <div v-if="vaInfo" class="va-info">
                <h5 class="mb-3">Hoặc chuyển khoản trực tiếp</h5>
                <div class="va-details">
                  <div class="va-item mb-3">
                    <label class="fw-bold">Số tài khoản:</label>
                    <div class="va-value">
                      <span class="account-number">{{ vaInfo.account }}</span>
                      <button 
                        class="btn btn-sm btn-outline-primary ms-2" 
                        @click="copyToClipboard(vaInfo.account)"
                        title="Copy số tài khoản"
                      >
                        <i class="fa fa-copy"></i> Copy
                      </button>
                    </div>
                  </div>
                  
                  <div class="va-item mb-3">
                    <label class="fw-bold">Ngân hàng:</label>
                    <div class="va-value">{{ vaInfo.bank }}</div>
                  </div>
                  
                  <div class="va-item mb-3">
                    <label class="fw-bold">Chủ tài khoản:</label>
                    <div class="va-value">{{ vaInfo.accountName || 'OpenLearn Foundation' }}</div>
                  </div>
                  
                  <div class="va-item mb-3">
                    <label class="fw-bold">Nội dung chuyển khoản:</label>
                    <div class="va-value">
                      <span class="content-text">{{ vaInfo.content }}</span>
                      <button 
                        class="btn btn-sm btn-outline-primary ms-2" 
                        @click="copyToClipboard(vaInfo.content)"
                        title="Copy nội dung"
                      >
                        <i class="fa fa-copy"></i> Copy
                      </button>
                    </div>
                    <small class="text-danger d-block mt-1">
                      ⚠️ Lưu ý: Nội dung chuyển khoản phải chính xác để hệ thống nhận diện
                    </small>
                  </div>
                  
                  <div class="va-item mb-3">
                    <label class="fw-bold">Số tiền:</label>
                    <div class="va-value text-danger fw-bold">{{ formatPrice(amount) }} VND</div>
                  </div>
                </div>
              </div>

              <!-- Instructions -->
              <div v-if="vaInfo && vaInfo.instructions" class="instructions mt-4 pt-4 border-top">
                <h6 class="mb-2">Hướng dẫn thanh toán:</h6>
                <ul class="list-unstyled">
                  <li v-for="(instruction, index) in vaInfo.instructions" :key="index" class="mb-1">
                    <i class="fa fa-check text-success me-2"></i>{{ instruction }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Payment Status -->
          <div class="card shadow-sm mb-4">
            <div class="card-body p-4">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h6 class="mb-1">Trạng thái thanh toán</h6>
                  <p class="mb-0 text-muted small">Payment ID: {{ paymentId }}</p>
                </div>
                <div>
                  <span :class="['badge', statusBadgeClass]">{{ paymentStatus }}</span>
                </div>
              </div>
              
              <div v-if="isPending" class="mt-3">
                <div class="progress mb-2">
                  <div 
                    class="progress-bar progress-bar-striped progress-bar-animated" 
                    role="progressbar" 
                    style="width: 100%"
                  ></div>
                </div>
                <p class="text-muted small mb-0">
                  <i class="fa fa-clock-o me-1"></i>
                  Đang chờ thanh toán... Hệ thống sẽ tự động cập nhật khi nhận được thanh toán.
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="text-center">
            <button @click="checkPaymentStatus" class="btn btn-primary me-2" :disabled="checking">
              <i class="fa fa-refresh" :class="{ 'fa-spin': checking }"></i>
              {{ checking ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán' }}
            </button>
            <button @click="goBack" class="btn btn-outline-secondary">
              <i class="fa fa-arrow-left"></i> Quay lại
            </button>
          </div>

          <!-- Toast Notification -->
          <div v-if="toastMessage" class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1055">
            <div class="toast show" role="alert">
              <div class="toast-header" :class="toastType === 'success' ? 'bg-success text-white' : 'bg-danger text-white'">
                <strong class="me-auto">{{ toastType === 'success' ? 'Thành công' : 'Lỗi' }}</strong>
                <button type="button" class="btn-close btn-close-white" @click="toastMessage = ''"></button>
              </div>
              <div class="toast-body">
                {{ toastMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPaymentStatus } from '@/utils/courseAPI'
import axios from 'axios'

export default {
  name: 'PaymentVAView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const paymentId = ref(route.query.payment_id || '')
    const courseId = ref(route.query.course_id || '')
    const amount = ref(parseInt(route.query.amount) || 0)
    const courseTitle = ref('')
    const qrCodeUrl = ref('')
    const vaInfo = ref(null)
    const paymentStatus = ref('Đang chờ thanh toán')
    const checking = ref(false)
    const toastMessage = ref('')
    const toastType = ref('success')

    // Load payment data from localStorage or fetch from API
    const loadPaymentData = async () => {
      try {
        // Try to load from localStorage first
        const pendingPayment = localStorage.getItem('pendingPayment')
        if (pendingPayment) {
          const paymentData = JSON.parse(pendingPayment)
          if (paymentData.payment_id === paymentId.value) {
            // Với PayOS, dùng payment_url để mở trang thanh toán (không có VA info cố định)
            qrCodeUrl.value = ''
            vaInfo.value = null
            amount.value = paymentData.amount || amount.value
            // Tự động mở PayOS checkoutUrl trong tab mới nếu có
            if (paymentData.payment_url) {
              window.open(paymentData.payment_url, '_blank')
            }
          }
        }

        // Fetch course info
        if (courseId.value) {
          try {
            const courseResponse = await axios.get(`/api/courses/${courseId.value}`)
            if (courseResponse.data.success && courseResponse.data.data) {
              courseTitle.value = courseResponse.data.data.title || 'Khóa học'
            }
          } catch (error) {
            console.error('Error fetching course:', error)
          }
        }

        // Fetch payment status
        if (paymentId.value) {
          await checkPaymentStatus()
        }
      } catch (error) {
        console.error('Error loading payment data:', error)
        showToast('Không thể tải thông tin thanh toán', 'error')
      }
    }

    const checkPaymentStatus = async () => {
      if (!paymentId.value) return
      
      checking.value = true
      try {
        const response = await getPaymentStatus(paymentId.value)
        if (response.success && response.data) {
          const status = response.data.status
          paymentStatus.value = getStatusText(status)
          
          // Nếu payment đã hoàn tất, chuyển sang trang "Khóa học của tôi"
          if (status === 'completed' || status === 'success') {
            showToast('Thanh toán thành công! Đang chuyển hướng...', 'success')
            // Xóa pending payment trong localStorage
            localStorage.removeItem('pendingPayment')
            setTimeout(() => {
              router.push('/courses/mine')
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
        showToast('Không thể kiểm tra trạng thái thanh toán', 'error')
      } finally {
        checking.value = false
      }
    }

    const getStatusText = (status) => {
      const statusMap = {
        'pending': 'Đang chờ thanh toán',
        'processing': 'Đang xử lý',
        'completed': 'Đã thanh toán',
        'success': 'Thanh toán thành công',
        'failed': 'Thanh toán thất bại',
        'cancelled': 'Đã hủy'
      }
      return statusMap[status] || status
    }

    const statusBadgeClass = computed(() => {
      const status = paymentStatus.value.toLowerCase()
      if (status.includes('thành công') || status.includes('completed') || status.includes('success')) {
        return 'bg-success'
      } else if (status.includes('thất bại') || status.includes('failed') || status.includes('cancelled')) {
        return 'bg-danger'
      } else if (status.includes('xử lý') || status.includes('processing')) {
        return 'bg-warning'
      }
      return 'bg-secondary'
    })

    const isPending = computed(() => {
      return paymentStatus.value.includes('chờ') || paymentStatus.value.includes('pending')
    })

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        showToast('Đã copy vào clipboard!', 'success')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        showToast('Không thể copy', 'error')
      }
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN').format(price)
    }

    const showToast = (message, type = 'success') => {
      toastMessage.value = message
      toastType.value = type
      setTimeout(() => {
        toastMessage.value = ''
      }, 3000)
    }

    const goBack = () => {
      router.back()
    }

    // Auto-check payment status every 10 seconds
    let statusCheckInterval = null
    onMounted(() => {
      loadPaymentData()
      
      // Auto-check status every 10 seconds if pending
      statusCheckInterval = setInterval(() => {
        if (isPending.value) {
          checkPaymentStatus()
        }
      }, 10000)
    })

    // Cleanup interval on unmount
    onUnmounted(() => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    })

    return {
      paymentId,
      courseId,
      amount,
      courseTitle,
      qrCodeUrl,
      vaInfo,
      paymentStatus,
      checking,
      toastMessage,
      toastType,
      statusBadgeClass,
      isPending,
      checkPaymentStatus,
      copyToClipboard,
      formatPrice,
      goBack
    }
  }
}
</script>

<style scoped>
.payment-va-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 0;
}

.card {
  border: none;
  border-radius: 12px;
}

.qr-code-container {
  display: inline-block;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-code-img {
  width: 250px;
  height: 250px;
  max-width: 100%;
  display: block;
}

.va-info {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.va-item {
  display: flex;
  flex-direction: column;
}

.va-item label {
  margin-bottom: 0.5rem;
  color: #495057;
}

.va-value {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
}

.account-number {
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;
}

.content-text {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: #28a745;
  font-weight: 500;
}

.instructions {
  background: #e7f3ff;
  padding: 1rem;
  border-radius: 8px;
}

.instructions ul li {
  padding: 0.25rem 0;
}

.progress {
  height: 8px;
}

.toast-container {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .qr-code-img {
    width: 200px;
    height: 200px;
  }
  
  .va-value {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .va-value button {
    margin-top: 0.5rem;
    margin-left: 0 !important;
  }
}
</style>


