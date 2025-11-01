const express = require('express');
const router = express.Router();

console.log('\n📋 Loading auth routes...');

// Import controllers với error handling
let CreateAccount, LoginAccount, getCustomerByEmail, updateCustomerInfo, checkEmailExists, verifyEmail;

try {
    const controllers = require('../controllers/authController');
    CreateAccount = controllers.CreateAccount;
    LoginAccount = controllers.LoginAccount;
    getCustomerByEmail = controllers.getCustomerByEmail;
    updateCustomerInfo = controllers.updateCustomerInfo;
    checkEmailExists = controllers.checkEmailExists;
    verifyEmail = controllers.verifyEmail;
    console.log('✅ Controllers loaded successfully');
} catch (error) {
    console.error('❌ Error loading controllers:', error);
    throw error;
}

// Middleware để log route access
const logRoute = (routeName) => {
    return (req, res, next) => {
        console.log(`\n🎯 Route hit: ${routeName}`);
        console.log(`Method: ${req.method}, Path: ${req.path}`);
        next();
    };
};

// Wrapper để catch errors và log
const asyncHandler = (fn, routeName) => {
    return async (req, res, next) => {
        try {
            console.log(`\n🎯 Executing: ${routeName}`);
            await fn(req, res, next);
        } catch (error) {
            console.error(`\n❌ Error in ${routeName}:`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: `Lỗi xử lý request tại ${routeName}`,
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    };
};

// Public routes
router.post('/register', logRoute('POST /register'), asyncHandler(CreateAccount, 'POST /register'));
router.post('/createaccount', logRoute('POST /createaccount'), asyncHandler(CreateAccount, 'POST /createaccount')); // Giữ route cũ để backward compatibility
router.post('/login', logRoute('POST /login'), asyncHandler(LoginAccount, 'POST /login'));
router.post('/checkemail', logRoute('POST /checkemail'), asyncHandler(checkEmailExists, 'POST /checkemail'));
router.get('/verify', logRoute('GET /verify'), asyncHandler(verifyEmail, 'GET /verify'));

// Handle GET requests to POST-only endpoints (show error message)
router.get('/register', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Method Not Allowed. Vui lòng sử dụng POST method để đăng ký.',
        allowedMethods: ['POST'],
        example: {
            method: 'POST',
            url: 'http://localhost:3001/register',
            body: {
                fullName: 'Your Name',
                email: 'your.email@example.com',
                passWord: 'yourpassword'
            }
        }
    });
});

router.get('/login', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Method Not Allowed. Vui lòng sử dụng POST method để đăng nhập.',
        allowedMethods: ['POST'],
        example: {
            method: 'POST',
            url: 'http://localhost:3001/login',
            body: {
                email: 'your.email@example.com',
                passWord: 'yourpassword'
            }
        }
    });
});

// Protected routes (có thể thêm middleware JWT sau)
router.get('/customer', getCustomerByEmail);
router.post('/customer/update', updateCustomerInfo);

module.exports = router;