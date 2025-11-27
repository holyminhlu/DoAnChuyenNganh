# Scripts for Course Service

## create-enrollments-collection.js

Script để tạo và kiểm tra collection `Enrollments` trong MongoDB.

### Cách sử dụng:

```bash
cd server/course-service
npm run create-collection
```

Hoặc:

```bash
cd server/course-service
node scripts/create-enrollments-collection.js
```

### Chức năng:

1. Kết nối đến MongoDB database `EduShareDB`
2. Kiểm tra xem collection `Enrollments` đã tồn tại chưa
3. Tạo collection nếu chưa có
4. Tạo các indexes cần thiết:
   - `enrollment_id` (unique)
   - `user_id` (indexed)
   - `course_id` (indexed)
   - `user_id + course_id` (compound unique index)
   - `enrolledAt` (indexed, descending)
5. Test insert và query để đảm bảo collection hoạt động đúng

### Collection Schema:

```javascript
{
  enrollment_id: String (unique),
  user_id: String (indexed),
  course_id: String (indexed),
  enrolledAt: Date,
  progress: {
    completedLessons: [{
      lesson_id: String,
      completedAt: Date
    }],
    lastAccessedLesson: {
      lesson_id: String,
      module_id: String
    },
    completionPercentage: Number (0-100)
  },
  status: String ('active' | 'completed' | 'cancelled'),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Lưu ý:

- Collection sẽ được tự động tạo khi lưu document đầu tiên
- Script này chỉ để đảm bảo collection tồn tại và có đúng indexes
- Chạy script này trước khi sử dụng tính năng lưu tiến độ

