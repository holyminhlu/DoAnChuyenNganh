// Debug Request - Test đăng ký với logging chi tiết
const http = require('http');
const { v4: uuidv4 } = require('uuid');

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

function testRegister() {
    return new Promise((resolve, reject) => {
        const testData = {
            fullName: 'Test User Debug',
            email: `test_debug_${Date.now()}@example.com`,
            passWord: 'password123',
            phone: '0123456789'
        };

        const postData = JSON.stringify(testData);

        log('\n🧪 ========== TEST REGISTER REQUEST ==========\n', 'blue');
        log('Request Data:', 'cyan');
        console.log(JSON.stringify(testData, null, 2));

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        log('\n📤 Sending request...', 'yellow');
        log(`URL: http://${options.hostname}:${options.port}${options.path}`, 'cyan');
        log(`Method: ${options.method}`, 'cyan');
        log(`Headers:`, 'cyan');
        console.log(JSON.stringify(options.headers, null, 2));

        const startTime = Date.now();
        const req = http.request(options, (res) => {
            const duration = Date.now() - startTime;
            
            log(`\n📥 Response received (${duration}ms)`, 'green');
            log(`Status Code: ${res.statusCode}`, res.statusCode < 400 ? 'green' : 'red');
            log(`Status Message: ${res.statusMessage}`, res.statusCode < 400 ? 'green' : 'red');
            log(`Headers:`, 'cyan');
            console.log(JSON.stringify(res.headers, null, 2));

            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                log('\n📄 Response Body:', 'cyan');
                try {
                    const response = JSON.parse(data);
                    console.log(JSON.stringify(response, null, 2));
                    
                    if (response.success) {
                        log('\n✅ REGISTER SUCCESS!', 'green');
                        log(`   User ID: ${response.data?.user?.id}`, 'cyan');
                        log(`   Email: ${response.data?.user?.email}`, 'cyan');
                    } else {
                        log('\n❌ REGISTER FAILED!', 'red');
                        log(`   Message: ${response.message}`, 'red');
                        if (response.error) {
                            log(`   Error: ${response.error}`, 'red');
                        }
                    }
                    
                    resolve({
                        statusCode: res.statusCode,
                        success: response.success,
                        data: response
                    });
                } catch (e) {
                    log('\n⚠️ Response không phải JSON', 'yellow');
                    log('Raw response:', 'cyan');
                    console.log(data);
                    resolve({
                        statusCode: res.statusCode,
                        success: false,
                        rawData: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            log('\n❌ REQUEST ERROR:', 'red');
            log(`Error: ${error.message}`, 'red');
            log(`Code: ${error.code}`, 'red');
            
            log('\n💡 Possible causes:', 'yellow');
            if (error.code === 'ECONNREFUSED') {
                log('   - Service chưa chạy', 'yellow');
                log('   - Fix: cd server/auth-service && npm start', 'yellow');
            } else if (error.code === 'ENOTFOUND') {
                log('   - Hostname không tìm thấy', 'yellow');
            } else {
                log('   - Network error', 'yellow');
            }
            
            reject(error);
        });

        req.on('timeout', () => {
            log('\n⏱️ REQUEST TIMEOUT', 'red');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.setTimeout(10000); // 10 seconds

        log('\n📝 Writing request body...', 'yellow');
        req.write(postData);
        req.end();
        log('✅ Request sent\n', 'green');
    });
}

async function testServiceHealth() {
    return new Promise((resolve, reject) => {
        log('\n🔍 Checking service health...', 'yellow');
        
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: '/test',
            method: 'GET'
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    log('✅ Service is running', 'green');
                    resolve(true);
                } else {
                    log(`⚠️ Service returned status ${res.statusCode}`, 'yellow');
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            log('❌ Service không chạy', 'red');
            log(`Error: ${error.message}`, 'red');
            log('\n💡 Start service: cd server/auth-service && npm start', 'yellow');
            resolve(false);
        });
        
        req.end();
    });
}

async function runDebug() {
    log('\n🚀 ========== DEBUG REQUEST - KIỂM TRA ĐĂNG KÝ ==========\n', 'blue');
    
    // Check service health first
    const serviceRunning = await testServiceHealth();
    
    if (!serviceRunning) {
        log('\n❌ Service không chạy. Không thể test.', 'red');
        process.exit(1);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test register
    try {
        await testRegister();
    } catch (error) {
        log(`\n💥 Fatal error: ${error.message}`, 'red');
        process.exit(1);
    }
    
    log('\n✅ Debug complete\n', 'green');
}

// Run
runDebug();

