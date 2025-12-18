const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = createProxyMiddleware({
  target: 'http://localhost:3004', // Course service port
  changeOrigin: true,
  // /api/payments/create -> router strip /api/payments -> /create -> prepend /payments -> /payments/create
  pathRewrite: {
    '^/(.*)': '/payments/$1'
  },
  selfHandleResponse: false,
  // Tăng timeout để có đủ thời gian gọi PayOS
  timeout: 60000,
  proxyTimeout: 60000,
  logLevel: 'debug'
});
