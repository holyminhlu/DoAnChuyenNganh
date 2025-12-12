const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

const FORUM_SERVICE_URL = 'http://localhost:3005';

// Proxy all forum/posts requests
// Use router.use without a wildcard path to avoid path-to-regexp errors
router.use(async (req, res) => {
  try {
    const url = `${FORUM_SERVICE_URL}${req.originalUrl.replace('/api/forum', '')}`;
    
    console.log(`📨 Proxying to Forum Service: ${req.method} ${url}`);
    console.log(`Content-Type: ${req.headers['content-type']}`);
    
    let config = {
      method: req.method,
      url: url,
      headers: {
        ...req.headers,
        host: 'localhost:3005'
      },
      params: req.query
    };

    // Handle multipart/form-data (file uploads)
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      // For multipart, we need to pass the raw request stream
      // Remove content-length as it will be recalculated
      delete config.headers['content-length'];
      config.data = req;
      config.maxBodyLength = Infinity;
      config.maxContentLength = Infinity;
    } else {
      // For JSON and other content types
      config.data = req.body;
    }

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Forum Proxy Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Forum Service không khả dụng. Vui lòng kiểm tra service đang chạy.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Lỗi kết nối đến Forum Service',
        error: error.message
      });
    }
  }
});

module.exports = router;

