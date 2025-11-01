// Test MongoDB Connection
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...\n');

mongoose.connect('mongodb://127.0.0.1:27017/EduShareDB')
.then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('✅ Database: EduShareDB');
    console.log('✅ Host: 127.0.0.1:27017');
    
    // Test tạo collection
    mongoose.connection.db.listCollections().toArray((err, collections) => {
        if (err) {
            console.error('⚠️ Error listing collections:', err);
        } else {
            console.log('✅ Collections:', collections.map(c => c.name));
        }
        process.exit(0);
    });
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('\n💡 Solutions:');
    console.error('1. Check MongoDB đã chạy: net start MongoDB');
    console.error('2. Check port 27017 đang mở');
    console.error('3. Check MongoDB service status');
    process.exit(1);
});

