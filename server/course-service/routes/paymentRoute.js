const express = require('express')
const router = express.Router()

const {
  createPayment,
  getPaymentStatus
} = require('../controllers/paymentController')

router.post('/create', createPayment)
router.get('/:payment_id/status', getPaymentStatus)

module.exports = router
