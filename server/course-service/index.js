const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const courseRoute = require('./routes/courseRoute')
const paymentRoute = require('./routes/paymentRoute')

const app = express()
const PORT = process.env.PORT || 3004

// CORS
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:3004'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}))

// Body parser
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/uploads/thumbnails', express.static(path.join(__dirname, 'uploads/thumbnails')))
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')))

// Simple request logger
app.use((req, res, next) => {
  console.log(`\n📥 ${req.method} ${req.path}`)
  console.log('Query:', req.query)
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    origin: req.headers['origin']
  })
  next()
})

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/EduShareDB'

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2
}).then(() => {
  console.log('\n✅ MONGODB CONNECTED')
  console.log('URI:', MONGODB_URI)
}).catch(err => {
  console.error('\n❌ MONGODB CONNECTION ERROR')
  console.error('Error:', err.message)
})

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Course Service đang chạy bình thường!',
    timestamp: new Date().toISOString(),
    endpoints: {
      getAll: 'GET /courses',
      search: 'GET /courses/search',
      getById: 'GET /courses/:id',
      enroll: 'POST /courses/:id/enroll',
      myEnrollments: 'GET /courses/my-enrollments/:userId',
      updateProgress: 'PUT /courses/:id/progress',
      test: 'GET /test'
    }
  })
})

// Routes
app.use('/courses', courseRoute)
app.use('/payments', paymentRoute)

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EduShare Course Service đang chạy',
    version: '1.0.0',
    endpoints: {
      getAll: 'GET /courses',
      search: 'GET /courses/search',
      getById: 'GET /courses/:id',
      enroll: 'POST /courses/:id/enroll',
      myEnrollments: 'GET /courses/my-enrollments/:userId',
      updateProgress: 'PUT /courses/:id/progress',
      createPayment: 'POST /payments/create',
      getPaymentStatus: 'GET /payments/:payment_id/status',
      test: 'GET /test'
    }
  })
})

// 404 handler
app.use((req, res) => {
  console.log(`\n⚠️ 404 NOT FOUND: ${req.method} ${req.path}`)
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} không tồn tại`,
    availableRoutes: {
      getAll: 'GET /courses',
      search: 'GET /courses/search',
      getById: 'GET /courses/:id',
      enroll: 'POST /courses/:id/enroll',
      myEnrollments: 'GET /courses/my-enrollments/:userId',
      updateProgress: 'PUT /courses/:id/progress',
      createPayment: 'POST /payments/create',
      getPaymentStatus: 'GET /payments/:payment_id/status',
      test: 'GET /test',
      root: 'GET /'
    }
  })
})

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Course-Service đang lắng nghe tại http://localhost:' + PORT)
})
