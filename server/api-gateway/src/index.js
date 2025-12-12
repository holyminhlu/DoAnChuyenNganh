const express = require('express');
const cors = require('cors');
const proxyRoutes = require('./routes/proxyRoutes');
const loggerMid = require('./middleware/loggerMid');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration với options cho multipart
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Parse JSON body conditionally - skip for streaming endpoints to avoid conflicts
app.use((req, res, next) => {
  const originalUrl = req.originalUrl || '';
  const currentPath = req.path || '';
  const isCoursesRoute = originalUrl.includes('/courses') || currentPath.includes('/courses');
  const isEnrollRoute = isCoursesRoute &&
    (originalUrl.includes('/enroll') || currentPath.includes('/enroll'));
  const isProgressRoute = isCoursesRoute &&
    (originalUrl.includes('/progress') || currentPath.includes('/progress'));

  const shouldSkipJsonParsing =
    (isEnrollRoute && req.method === 'POST') ||
    (isProgressRoute && req.method === 'PUT');

  if (shouldSkipJsonParsing) {
    const reason = isEnrollRoute ? 'enroll' : 'progress';
    console.log(`⏭️ Skipping body parsing for courses ${reason} - proxy will forward raw stream`);
    return next();
  }
  
  // Parse JSON for all other routes
  const jsonParser = express.json({ 
    limit: '50mb',
    verify: (req, res, buf, encoding) => {
      // Store raw body for debugging if needed
      req.rawBody = buf;
    }
  });
  
  jsonParser(req, res, (err) => {
    if (err) {
      console.error('❌ JSON parsing error:', err.message);
      console.error('   Path:', req.originalUrl);
      console.error('   Content-Type:', req.headers['content-type']);
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in request body',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    next();
  });
});

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(loggerMid);            // ✅ logger có thể đọc body nếu cần

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    routes: {
      courses: '/api/courses',
      documents: '/api/documents',
      auth: '/api/auth'
    }
  });
});

app.use('/api', proxyRoutes);  // ✅ Proxy sau cùng

// 404 handler
app.use((req, res) => {
  console.log(`\n⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} không tồn tại`,
    availableRoutes: {
      courses: 'GET /api/courses',
      documents: 'GET /api/documents',
      auth: 'POST /api/auth/login',
      test: 'GET /test'
    }
  });
});

// Global error handler - Bắt tất cả lỗi không được handle
app.use((err, req, res, next) => {
  console.error('\n💥 ========== UNHANDLED ERROR ==========');
  console.error('Error:', err);
  console.error('Request:', req.method, req.path);
  console.error('Stack:', err.stack);
  console.error('======================================\n');
  
  res.status(500).json({
    success: false,
    message: 'Đã có lỗi xảy ra trên server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\n💥 ========== UNCAUGHT EXCEPTION ==========');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('==========================================\n');
  // Don't exit - keep server running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 ========== UNHANDLED REJECTION ==========');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('============================================\n');
  // Don't exit - keep server running
});

// Start server
try {
  const server = app.listen(PORT, () => {
    console.log('\n🚀 =======================================');
    console.log(`✅ API Gateway đang lắng nghe tại http://localhost:${PORT}`);
    console.log(`✅ Test endpoint: http://localhost:${PORT}/test`);
    console.log(`✅ Courses endpoint: http://localhost:${PORT}/api/courses`);
    console.log(`✅ Documents endpoint: http://localhost:${PORT}/api/documents`);
    console.log(`✅ Auth endpoint: http://localhost:${PORT}/api/auth`);
    console.log(`✅ Forum endpoint: http://localhost:${PORT}/api/forum`);
    console.log('======================================\n');
    console.log('💡 Nhấn Ctrl+C để dừng server\n');
  });

  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} đã được sử dụng. Vui lòng chọn port khác hoặc dừng service đang chạy.\n`);
    } else {
      console.error('\n❌ Server error:', err);
    }
    process.exit(1);
  });
} catch (err) {
  console.error('\n❌ Lỗi khởi động server:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
}
