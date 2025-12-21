<template>
  <main class="contact-page">
    <div class="container">
      <h1 class="page-title">LIÊN HỆ</h1>
      <p class="intro-text">
        Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn trong quá trình sử dụng website Chia sẻ tài liệu và Học tập trực tuyến.
      </p>
      <p class="intro-text">
        Nếu bạn có bất kỳ thắc mắc, góp ý, báo lỗi hệ thống hoặc yêu cầu hỗ trợ nào, vui lòng liên hệ với chúng tôi thông qua các kênh bên dưới.
      </p>

      <section class="contact-section">
        <h2 class="section-title">Website: Chia sẻ tài liệu và Học tập trực tuyến</h2>
        
        <div class="contact-info">
          <div class="info-item">
            <h3 class="info-label">Email hỗ trợ:</h3>
            <p class="info-value">openlearnfoundation.support@gmail.com</p>
            <p class="info-value">hoặc: holyminhludauden@gmail.com (Admin Minh Lữ)</p>
          </div>

          <div class="info-item">
            <h3 class="info-label">Hotline:</h3>
            <p class="info-value">0983149203</p>
          </div>

          <div class="info-item">
            <h3 class="info-label">Thời gian hỗ trợ:</h3>
            <p class="info-value">Thứ Hai – Thứ Sáu</p>
            <p class="info-value">08:00 – 17:00 (Giờ hành chính)</p>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script>
export default {
  name: 'GioiThieu'
}
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
  padding: 120px 0 60px;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
  text-align: center;
  letter-spacing: 0.5px;
}

.intro-text {
  font-size: 16px;
  line-height: 1.7;
  color: #4b5563;
  margin-bottom: 16px;
  text-align: center;
}

.contact-section {
  margin-top: 48px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 32px;
  text-align: center;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.info-item {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.info-label {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.info-value {
  font-size: 16px;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 8px;
}

.info-value:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .contact-page {
    padding: 100px 0 40px;
  }

  .page-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 18px;
  }

  .info-label {
    font-size: 16px;
  }

  .info-value {
    font-size: 15px;
  }

  .info-item {
    padding: 20px;
  }
}
</style>
