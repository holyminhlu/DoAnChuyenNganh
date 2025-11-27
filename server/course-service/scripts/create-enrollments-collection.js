/**
 * Script to create Enrollments collection in MongoDB
 * Run: node scripts/create-enrollments-collection.js
 */

const mongoose = require('mongoose')
const Enrollment = require('../models/enrollmentModel')

const MONGODB_URI = 'mongodb://127.0.0.1:27017/EduShareDB'

async function createEnrollmentsCollection() {
  try {
    console.log('\n🔄 ========== CREATING ENROLLMENTS COLLECTION ==========\n')
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB:', MONGODB_URI)
    
    // Get database
    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    console.log('\n📋 Existing collections:', collectionNames)
    
    // Check if Enrollments collection exists
    if (collectionNames.includes('Enrollments')) {
      console.log('✅ Enrollments collection already exists')
      
      // Get collection stats using db.command
      try {
        const stats = await db.command({ collStats: 'Enrollments' })
        console.log('📊 Collection stats:')
        console.log('   - Documents:', stats.count || 0)
        console.log('   - Size:', stats.size ? (stats.size / 1024).toFixed(2) + ' KB' : 'N/A')
        console.log('   - Indexes:', stats.nindexes || 0)
      } catch (statsError) {
        console.log('⚠️ Could not get collection stats:', statsError.message)
        // Get document count instead
        const count = await db.collection('Enrollments').countDocuments()
        console.log('📊 Document count:', count)
      }
    } else {
      console.log('📝 Creating Enrollments collection...')
      
      // Create collection by inserting a dummy document and then deleting it
      // This ensures the collection is created with proper schema
      const tempEnrollment = new Enrollment({
        enrollment_id: 'temp_' + Date.now(),
        user_id: 'temp_user',
        course_id: 'temp_course',
        progress: {
          completedLessons: [],
          completionPercentage: 0
        },
        status: 'active'
      })
      
      await tempEnrollment.save()
      console.log('✅ Collection created')
      
      // Delete temp document
      await Enrollment.deleteOne({ enrollment_id: tempEnrollment.enrollment_id })
      console.log('✅ Temp document removed')
    }
    
    // Ensure indexes exist
    console.log('\n📇 Creating indexes...')
    await Enrollment.createIndexes()
    console.log('✅ Indexes created/verified')
    
    // List all indexes
    const indexes = await db.collection('Enrollments').indexes()
    console.log('\n📑 Indexes on Enrollments collection:')
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${index.name}:`, JSON.stringify(index.key))
    })
    
    // Test insert and query
    console.log('\n🧪 Testing collection...')
    const testEnrollment = new Enrollment({
      user_id: 'test_user_' + Date.now(),
      course_id: 'test_course_' + Date.now(),
      progress: {
        completedLessons: [
          { lesson_id: 'lesson_1', completedAt: new Date() }
        ],
        completionPercentage: 25
      },
      status: 'active'
    })
    
    await testEnrollment.save()
    console.log('✅ Test document inserted:', testEnrollment.enrollment_id)
    
    // Query test
    const found = await Enrollment.findOne({ enrollment_id: testEnrollment.enrollment_id })
    console.log('✅ Test document queried:', found ? 'Success' : 'Failed')
    
    // Clean up test document
    await Enrollment.deleteOne({ enrollment_id: testEnrollment.enrollment_id })
    console.log('✅ Test document removed')
    
    console.log('\n✅ ========== ENROLLMENTS COLLECTION READY ==========\n')
    console.log('Collection name: Enrollments')
    console.log('Database: EduShareDB')
    console.log('Schema fields:')
    console.log('  - enrollment_id (String, unique)')
    console.log('  - user_id (String, indexed)')
    console.log('  - course_id (String, indexed)')
    console.log('  - enrolledAt (Date)')
    console.log('  - progress.completedLessons (Array)')
    console.log('  - progress.lastAccessedLesson (Object)')
    console.log('  - progress.completionPercentage (Number, 0-100)')
    console.log('  - status (String: active/completed/cancelled)')
    console.log('  - createdAt, updatedAt (auto)')
    console.log('\n')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error creating Enrollments collection:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  }
}

// Run script
createEnrollmentsCollection()

