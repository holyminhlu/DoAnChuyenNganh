// Debug Script - Kiểm tra và xác định lỗi đăng ký
const mongoose = require('mongoose');
const User = require('./models/authModel');
const bcrypt = require('bcrypt');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testMongoDBConnection() {
    log('\n📊 ========== TEST 1: MONGODB CONNECTION ==========', 'blue');
    
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/EduShareDB');
        log('✅ MongoDB Connected Successfully', 'green');
        
        // Check database
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        log(`✅ Found ${collections.length} collections`, 'green');
        
        return true;
    } catch (error) {
        log('❌ MongoDB Connection Failed', 'red');
        log(`Error: ${error.message}`, 'red');
        log('\n💡 Solutions:', 'yellow');
        log('1. Check MongoDB đã chạy: net start MongoDB', 'yellow');
        log('2. Check port 27017 có mở không', 'yellow');
        log('3. Try: mongosh mongodb://127.0.0.1:27017', 'yellow');
        return false;
    }
}

async function testModelImport() {
    log('\n📊 ========== TEST 2: MODEL IMPORT ==========', 'blue');
    
    try {
        const UserModel = require('./models/authModel');
        log('✅ User Model imported successfully', 'green');
        
        // Check schema
        if (UserModel.schema) {
            log('✅ User Schema exists', 'green');
            
            // Check required fields
            const schema = UserModel.schema.obj;
            log(`✅ Schema has ${Object.keys(schema).length} fields`, 'green');
            
            return true;
        } else {
            log('❌ User Schema not found', 'red');
            return false;
        }
    } catch (error) {
        log('❌ Model Import Failed', 'red');
        log(`Error: ${error.message}`, 'red');
        log(`Stack: ${error.stack}`, 'red');
        return false;
    }
}

async function testDependencies() {
    log('\n📊 ========== TEST 3: DEPENDENCIES ==========', 'blue');
    
    const dependencies = ['bcrypt', 'jsonwebtoken', 'mongoose', 'uuid'];
    let allOk = true;
    
    for (const dep of dependencies) {
        try {
            require(dep);
            log(`✅ ${dep} - OK`, 'green');
        } catch (error) {
            log(`❌ ${dep} - NOT FOUND`, 'red');
            log(`   Install: npm install ${dep}`, 'yellow');
            allOk = false;
        }
    }
    
    return allOk;
}

async function testCreateUser() {
    log('\n📊 ========== TEST 4: CREATE USER (DRY RUN) ==========', 'blue');
    
    try {
        const testData = {
            fullName: 'Test User Debug',
            email: `test_debug_${Date.now()}@example.com`,
            passWord: 'password123',
            role: 'student'
        };
        
        log('Test Data:', 'cyan');
        console.log(JSON.stringify(testData, null, 2));
        
        // Test validation
        log('\n🔍 Testing validation...', 'yellow');
        if (!testData.fullName || !testData.email || !testData.passWord) {
            log('❌ Validation failed: Missing required fields', 'red');
            return false;
        }
        log('✅ Validation passed', 'green');
        
        // Test password hash
        log('\n🔍 Testing password hash...', 'yellow');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testData.passWord, salt);
        log('✅ Password hashed successfully', 'green');
        log(`   Hash length: ${hashedPassword.length}`, 'cyan');
        
        // Test user creation (without saving)
        log('\n🔍 Testing user object creation...', 'yellow');
        const newUser = new User({
            fullName: testData.fullName.trim(),
            email: testData.email.toLowerCase().trim(),
            passWord: hashedPassword,
            phone: '',
            role: testData.role || 'student'
        });
        
        log('✅ User object created', 'green');
        log(`   Generated user_id: ${newUser.user_id}`, 'cyan');
        
        // Validate user object
        await newUser.validate();
        log('✅ User validation passed', 'green');
        
        // Test save (actually save to check for errors)
        log('\n🔍 Testing save to database...', 'yellow');
        await newUser.save();
        log('✅ User saved successfully', 'green');
        log(`   User ID: ${newUser._id}`, 'cyan');
        log(`   User ID (custom): ${newUser.user_id}`, 'cyan');
        
        // Clean up - delete test user
        await User.deleteOne({ _id: newUser._id });
        log('✅ Test user cleaned up', 'green');
        
        return true;
    } catch (error) {
        log('❌ Create User Test Failed', 'red');
        log(`Error name: ${error.name}`, 'red');
        log(`Error message: ${error.message}`, 'red');
        
        if (error.errors) {
            log('\nValidation errors:', 'red');
            Object.keys(error.errors).forEach(key => {
                log(`  - ${key}: ${error.errors[key].message}`, 'red');
            });
        }
        
        if (error.code) {
            log(`Error code: ${error.code}`, 'red');
            if (error.code === 11000) {
                log('💡 Duplicate key error - Email or user_id đã tồn tại', 'yellow');
            }
        }
        
        log(`\nStack trace:`, 'red');
        console.log(error.stack);
        
        return false;
    }
}

async function testEmailExists() {
    log('\n📊 ========== TEST 5: EMAIL CHECK ==========', 'blue');
    
    try {
        const testEmail = 'test_check@example.com';
        const existing = await User.findOne({ email: testEmail.toLowerCase() });
        
        if (existing) {
            log(`⚠️ Email ${testEmail} already exists`, 'yellow');
            log(`   User ID: ${existing._id}`, 'cyan');
        } else {
            log(`✅ Email ${testEmail} is available`, 'green');
        }
        
        return true;
    } catch (error) {
        log('❌ Email Check Failed', 'red');
        log(`Error: ${error.message}`, 'red');
        return false;
    }
}

async function checkExistingUsers() {
    log('\n📊 ========== TEST 6: EXISTING USERS ==========', 'blue');
    
    try {
        const count = await User.countDocuments();
        log(`📊 Total users in database: ${count}`, 'cyan');
        
        if (count > 0) {
            const users = await User.find().limit(5).select('email fullName role');
            log('\nSample users:', 'cyan');
            users.forEach((user, index) => {
                log(`  ${index + 1}. ${user.email} - ${user.fullName} (${user.role})`, 'cyan');
            });
        } else {
            log('📝 No users found in database', 'yellow');
        }
        
        return true;
    } catch (error) {
        log('❌ Check Users Failed', 'red');
        log(`Error: ${error.message}`, 'red');
        return false;
    }
}

async function runAllTests() {
    log('\n🚀 ========== DEBUG REGISTER - TỰ ĐỘNG KIỂM TRA ==========\n', 'blue');
    
    const results = {
        mongodb: false,
        model: false,
        dependencies: false,
        createUser: false,
        emailCheck: false,
        existingUsers: false
    };
    
    // Test 1: MongoDB Connection
    results.mongodb = await testMongoDBConnection();
    if (!results.mongodb) {
        log('\n❌ MongoDB không kết nối được. Dừng test.', 'red');
        await mongoose.disconnect();
        process.exit(1);
    }
    
    // Test 2: Model Import
    results.model = await testModelImport();
    
    // Test 3: Dependencies
    results.dependencies = await testDependencies();
    if (!results.dependencies) {
        log('\n⚠️ Một số dependencies thiếu. Chạy: npm install', 'yellow');
    }
    
    // Test 4: Create User
    if (results.model && results.mongodb) {
        results.createUser = await testCreateUser();
    }
    
    // Test 5: Email Check
    if (results.mongodb) {
        results.emailCheck = await testEmailExists();
    }
    
    // Test 6: Existing Users
    if (results.mongodb) {
        results.existingUsers = await checkExistingUsers();
    }
    
    // Summary
    log('\n📋 ========== KẾT QUẢ ==========', 'blue');
    console.log('\n');
    console.log('Test Results:');
    console.log(`  ✅ MongoDB Connection: ${results.mongodb ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Model Import: ${results.model ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Dependencies: ${results.dependencies ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Create User: ${results.createUser ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Email Check: ${results.emailCheck ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Existing Users: ${results.existingUsers ? 'PASS' : 'FAIL'}`);
    
    const allPassed = Object.values(results).every(r => r === true);
    
    if (allPassed) {
        log('\n✅ TẤT CẢ TEST PASS! Hệ thống hoạt động bình thường.', 'green');
        log('\n💡 Nếu đăng ký vẫn lỗi:', 'yellow');
        log('   1. Check request body format', 'yellow');
        log('   2. Check service đang chạy (npm start)', 'yellow');
        log('   3. Check console log khi đăng ký', 'yellow');
    } else {
        log('\n❌ MỘT SỐ TEST FAIL! Xem chi tiết ở trên.', 'red');
        log('\n💡 Fix các lỗi trên trước khi test lại.', 'yellow');
    }
    
    await mongoose.disconnect();
    log('\n✅ Debug complete\n', 'green');
}

// Run tests
runAllTests().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});

