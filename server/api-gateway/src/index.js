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

app.listen(PORT, () => {
  console.log(`API Gateway chạy tại http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
  console.log(`Courses endpoint: http://localhost:${PORT}/api/courses`);
});
