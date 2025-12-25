const { createProxyMiddleware } = require('http-proxy-middleware');

// Payments are implemented in course-service under /payments/*
// IMPORTANT: inside Docker, `localhost` is the api-gateway container itself.
// Use COURSE_SERVICE_URL (docker-compose sets it to http://course-service:3004).
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:3004';

module.exports = createProxyMiddleware({
  target: COURSE_SERVICE_URL,
  changeOrigin: true,
  // /api/payments/create -> /payments/create
  pathRewrite: {
    '^/(.*)': '/payments/$1'
  },
  selfHandleResponse: false,
  // Tăng timeout để có đủ thời gian gọi PayOS
  timeout: 60000,
  proxyTimeout: 60000,
  logLevel: 'debug'
});
