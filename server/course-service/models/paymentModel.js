const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const paymentSchema = new mongoose.Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `payment_${uuidv4()}`
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  course_id: {
    type: String,
    required: true,
    index: true
  },
  enrollment_id: {
    type: String,
    default: null,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'VND'
  },
  // PayOS specific fields
  payos_order_code: {
    type: Number,
    default: null,
    index: true
  },
  payos_payment_link_id: {
    type: String,
    default: null
  },
  payos_checkout_url: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  customer_info: {
    name: String,
    email: String,
    phone: String
  },
  provider_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  paid_at: {
    type: Date,
    default: null
  },
  expired_at: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'Payments'
})

paymentSchema.index({ payment_id: 1 }, { unique: true })
paymentSchema.index({ user_id: 1, course_id: 1 })
paymentSchema.index({ status: 1, createdAt: -1 })
paymentSchema.index({ payos_order_code: 1 })

module.exports = mongoose.model('Payments', paymentSchema)
