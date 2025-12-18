const Payment = require('../models/paymentModel')
const Enrollment = require('../models/enrollmentModel')
const Course = require('../models/courseModel')
const PayOS = require('@payos/node')

// Khởi tạo PayOS với chữ ký đúng (clientId, apiKey, checksumKey)
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
)

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required env: ${name}`)
  }
}

/**
 * POST /payments/create
 * Tạo PayOS payment link cho khóa học có phí
 */
exports.createPayment = async (req, res) => {
  const startTime = Date.now()
  console.log('\n💳 [PayOS] ========== CREATE PAYMENT REQUEST =========')
  console.log('Time:', new Date().toISOString())
  console.log('Body:', JSON.stringify(req.body || {}, null, 2))
  try {
    requireEnv('PAYOS_CLIENT_ID')
    requireEnv('PAYOS_API_KEY')
    requireEnv('PAYOS_CHECKSUM_KEY')

    const { course_id, courseId, user_id, userId } = req.body || {}
    const finalCourseId = course_id || courseId
    const finalUserId = user_id || userId || req.user?.id

    if (!finalCourseId || !finalUserId) {
      return res.status(400).json({
        success: false,
        message: 'course_id và user_id là bắt buộc'
      })
    }

    // Tìm khóa học theo cả MongoDB _id và field course_id để hỗ trợ hai kiểu ID
    let course = null
    console.log('💳 [PayOS] Looking up course for payment, id =', finalCourseId)

    // Thử tìm theo MongoDB _id nếu chuỗi trông giống ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(finalCourseId)) {
      try {
        course = await Course.findById(finalCourseId)
        if (course) {
          console.log('💳 [PayOS] Course found by _id:', finalCourseId)
        }
      } catch (e) {
        console.log('💳 [PayOS] Error finding course by _id:', e.message)
      }
    }

    // Nếu chưa thấy, thử theo course_id
    if (!course) {
      course = await Course.findOne({ course_id: finalCourseId })
      if (course) {
        console.log('💳 [PayOS] Course found by course_id:', finalCourseId)
      }
    }

    if (!course) {
      console.log('💳 [PayOS] Course not found for payment, id =', finalCourseId)
      return res.status(404).json({ success: false, message: 'Khóa học không tồn tại' })
    }

    // Luôn sử dụng course.course_id làm khóa chính logic cho enrollment/payment
    const businessCourseId = course.course_id

    if (course.pricing && (course.pricing.isFree || course.pricing.price === 0)) {
      return res.status(400).json({ success: false, message: 'Khóa học này miễn phí, không cần thanh toán' })
    }

    // Kiểm tra enrollment theo businessCourseId để tránh trùng
    const existingEnrollment = await Enrollment.findOne({ user_id: finalUserId, course_id: businessCourseId })
    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: 'Bạn đã đăng ký khóa học này rồi' })
    }

    // Tìm payment đang chờ theo businessCourseId để đồng bộ với Enrollment/MyCourses
    const pending = await Payment.findOne({
      user_id: finalUserId,
      course_id: businessCourseId,
      status: { $in: ['pending', 'processing'] }
    })

    if (pending && pending.payos_checkout_url && (!pending.expired_at || pending.expired_at > new Date())) {
      return res.json({
        success: true,
        message: 'Đã có payment đang chờ thanh toán',
        data: {
          payment_id: pending.payment_id,
          payment_url: pending.payos_checkout_url,
          amount: pending.amount,
          currency: pending.currency,
          status: pending.status
        }
      })
    }

    const amount = course.pricing?.price || 0

    const payment = await Payment.create({
      user_id: finalUserId,
      // Lưu businessCourseId để enrollment và "Khóa học của tôi" hoạt động đúng
      course_id: businessCourseId,
      amount,
      currency: course.pricing?.currency || 'VND',
      status: 'pending',
      customer_info: {
        name: req.user?.name || req.body?.customer_name || 'Khách hàng',
        email: req.user?.email || req.body?.customer_email || '',
        phone: req.user?.phone || req.body?.customer_phone || ''
      },
      metadata: {
        course_title: course.title,
        course_instructor: course.instructor?.name || 'Unknown'
      }
    })

    // PayOS orderCode phải là số, dùng timestamp + random
    const orderCode = Number(`${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`)

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080'

    // Gọi PayOS với timeout nội bộ 10s để tránh treo
    // Lưu ý: PayOS giới hạn description tối đa 25 ký tự
    const description = 'Thanh toan khoa hoc' // <= 25 ký tự, không dấu để an toàn
    console.log('💳 [PayOS] Calling createPaymentLink with orderCode:', orderCode, 'amount:', amount, 'description:', description)
    const payosPromise = payos.createPaymentLink({
      orderCode,
      amount,
      description,
      returnUrl: `${frontendUrl}/payment/success?payment_id=${payment.payment_id}&course_id=${finalCourseId}`,
      cancelUrl: `${frontendUrl}/payment/cancel?payment_id=${payment.payment_id}&course_id=${finalCourseId}`
    })
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PayOS create payment timeout after 10s')), 10000)
    })
    const payosLink = await Promise.race([payosPromise, timeoutPromise])
    console.log('💳 [PayOS] Response:', payosLink)

    payment.payos_order_code = orderCode
    payment.payos_payment_link_id = payosLink?.paymentLinkId || null
    payment.payos_checkout_url = payosLink?.checkoutUrl || null
    payment.status = 'processing'
    await payment.save()

    const elapsed = Date.now() - startTime
    console.log('💳 [PayOS] Payment created successfully in', elapsed, 'ms')

    return res.json({
      success: true,
      message: 'Tạo payment link thành công',
      data: {
        payment_id: payment.payment_id,
        payment_url: payment.payos_checkout_url,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status
      }
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error('❌ PayOS create payment error after', elapsed, 'ms:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo payment với PayOS',
      error: process.env.NODE_ENV === 'development' ? (error.message || error.toString()) : undefined
    })
  }
}

/**
 * GET /payments/:payment_id/status
 * Gọi PayOS để kiểm tra trạng thái và tự động enroll nếu đã thanh toán
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params
    if (!payment_id) {
      return res.status(400).json({ success: false, message: 'payment_id là bắt buộc' })
    }

    let payment = await Payment.findOne({ payment_id })
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment không tồn tại' })
    }

    // Nếu đã completed thì trả luôn
    if (payment.status === 'completed') {
      return res.json({ success: true, data: serializePayment(payment) })
    }

    if (!payment.payos_order_code) {
      return res.json({ success: true, data: serializePayment(payment) })
    }

    // Gọi PayOS để kiểm tra trạng thái payment link
    const payosStatus = await payos.getPaymentLinkInformation(payment.payos_order_code)
    console.log('💳 [PayOS] getPaymentLinkInformation response:', payosStatus)

    if (payosStatus && (payosStatus.status === 'PAID' || payosStatus.status === 'COMPLETED') && payment.status !== 'completed') {
      payment.status = 'completed'
      payment.paid_at = new Date()
      await payment.save()

      // Tạo enrollment nếu chưa có
      if (!payment.enrollment_id) {
        await createEnrollmentAfterPayment(payment)
        payment = await Payment.findOne({ payment_id })
      }
    }

    return res.json({ success: true, data: serializePayment(payment) })
  } catch (error) {
    console.error('❌ Get payment status (PayOS) error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái thanh toán',
      error: process.env.NODE_ENV === 'development' ? (error.message || error.toString()) : undefined
    })
  }
}

function serializePayment(payment) {
  return {
    payment_id: payment.payment_id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    course_id: payment.course_id,
    enrollment_id: payment.enrollment_id,
    paid_at: payment.paid_at,
    created_at: payment.createdAt
  }
}

async function createEnrollmentAfterPayment(payment) {
  const Enrollment = require('../models/enrollmentModel')
  const Course = require('../models/courseModel')

  // Tìm enrollment theo user + course_id (có thể là business course_id hoặc Mongo _id dạng string)
  const existing = await Enrollment.findOne({ user_id: payment.user_id, course_id: payment.course_id })
  if (existing) {
    payment.enrollment_id = existing.enrollment_id
    await payment.save()
    return existing
  }

  const enrollment = new Enrollment({
    user_id: payment.user_id,
    // Lưu đúng course_id giống trong Payment để đồng bộ với MyCourses
    course_id: payment.course_id,
    status: 'active',
    progress: {
      completedLessons: [],
      completionPercentage: 0
    }
  })
  await enrollment.save()

  payment.enrollment_id = enrollment.enrollment_id
  await payment.save()

  // Tăng enrolledCount cho course – hỗ trợ cả course_id (business) và _id
  await Course.updateOne(
    {
      $or: [
        { course_id: payment.course_id },
        // nếu payment.course_id là dạng ObjectId string thì thử theo _id
        (typeof payment.course_id === 'string' && /^[0-9a-fA-F]{24}$/.test(payment.course_id))
          ? { _id: payment.course_id }
          : { _id: null }
      ]
    },
    { $inc: { enrolledCount: 1 } }
  )

  return enrollment
}
