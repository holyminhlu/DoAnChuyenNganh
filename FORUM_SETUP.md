# 🚀 HƯỚNG DẪN KHỞI ĐỘNG DIỄN ĐÀN

## ❗ LỖI HIỆN TẠI
```
❌ Error: 404 Not Found khi đăng bài
❌ Request failed with status code 404
```

## ✅ NGUYÊN NHÂN & GIẢI PHÁP

**Nguyên nhân:** API Gateway chưa có route `/api/forum` hoặc chưa được restart sau khi thêm route.

**Đã sửa:**
1. ✅ Thêm `axios` dependency cho API Gateway
2. ✅ Restart API Gateway với route mới
3. ✅ Thêm logging chi tiết

---

## 🔧 KHỞI ĐỘNG SERVICES

### CÁCH 1: Tự Động (Khuyến nghị)
```cmd
START_ALL_SERVICES.bat
```
Script này sẽ:
- Kiểm tra MongoDB
- Start Forum Service (Terminal 1)
- Start API Gateway (Terminal 2)
- Test cả 2 services

### CÁCH 2: Thủ Công

**Terminal 1 - Forum Service:**
```cmd
START_FORUM.bat
```

**Terminal 2 - API Gateway:**
```cmd
START_API_GATEWAY.bat
```

---

## ✅ KIỂM TRA SERVICES ĐANG CHẠY

### PowerShell:
```powershell
netstat -ano | findstr ":3000 :3005"
```

**Kết quả mong đợi:**
```
TCP    0.0.0.0:3000    LISTENING    [PID]  ✅ API Gateway
TCP    0.0.0.0:3005    LISTENING    [PID]  ✅ Forum Service
```

### Test Endpoints:
```
http://localhost:3005/test  - Forum Service
http://localhost:3000/test  - API Gateway
```

---

## 📋 LOGS MONG ĐỢI

### Forum Service Terminal:
```
✅ ========== MONGODB CONNECTED ==========
✅ Forum-Service đang lắng nghe tại http://localhost:3005

📋 ========== GET ALL POSTS ==========
✅ Found X posts (Total: X)

📝 ========== CREATE POST REQUEST ==========
✅ Validation passed
💾 Saving post to database...
✅ Post saved successfully: 67abc...
```

### API Gateway Terminal:
```
API Gateway chạy tại http://localhost:3000

🔍 Router received: POST /forum/posts
🔗 Routing to forumProxy: POST /posts
📨 Proxying to Forum Service: POST http://localhost:3005/posts
```

### Browser Console (F12):
```
📝 Creating post with data: {...}
📤 Sending POST request to: /api/forum/posts
📥 Response status: 201
✅ Post created successfully
```

---

## 🧪 TEST THỬ NGHIỆM

### 1. Test Forum Service trực tiếp:
```cmd
curl http://localhost:3005/test
```

### 2. Test qua API Gateway:
```cmd
curl http://localhost:3000/api/forum/posts
```

### 3. Test tạo bài viết:
```cmd
curl -X POST http://localhost:3005/posts ^
  -H "Content-Type: application/json" ^
  -d "{\"author\":{\"userId\":\"test\",\"name\":\"Test\"},\"content\":\"Test post\"}"
```

---

## ❌ TROUBLESHOOTING

### Lỗi: Port already in use
```powershell
# Kill process
taskkill /F /PID [PID]
```

### Lỗi: Cannot find module 'axios'
```cmd
cd server\api-gateway
npm install axios
```

### Lỗi: MongoDB connection failed
```
Start MongoDB:
- MongoDB Compass
- hoặc: net start MongoDB
```

### Lỗi: 404 Not Found
**Giải pháp:**
1. Restart cả 2 services
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+F5)

---

## 📊 ARCHITECTURE

```
Browser (localhost:8080)
    ↓
API Gateway (localhost:3000)
    ↓ /api/forum/*
Forum Service (localhost:3005)
    ↓
MongoDB (localhost:27017)
    - Database: EduShareDB
    - Collection: posts
```

---

## ✅ CHECKLIST HOÀN THÀNH

Trước khi test, đảm bảo:

- [ ] MongoDB đang chạy (port 27017)
- [ ] Forum Service đang chạy (port 3005)
- [ ] API Gateway đang chạy (port 3000)
- [ ] Browser đã hard refresh (Ctrl+F5)
- [ ] Console không có error khi load trang
- [ ] Đã đăng nhập (có userId trong localStorage)

---

## 🎯 LÀM THEO THỨ TỰ

1. **Start MongoDB** (nếu chưa chạy)
2. **Double-click `START_ALL_SERVICES.bat`**
3. **Đợi 2 terminal windows mở ra**
4. **Kiểm tra cả 2 terminals có log success**
5. **Mở browser:** `http://localhost:8080/diendan`
6. **F12** → Console tab
7. **Thử đăng bài viết**
8. **Xem logs trong cả 3 nơi:**
   - Browser Console
   - Forum Service Terminal
   - API Gateway Terminal

---

## 📞 NẾU VẪN LỖI

Gửi cho tôi:

1. ✅ Screenshot 2 terminals (Forum + Gateway)
2. ✅ Browser Console logs (F12)
3. ✅ Network tab: Request/Response của `/api/forum/posts`
4. ✅ Output của: `netstat -ano | findstr ":3000 :3005"`

---

**QUAN TRỌNG:** Giữ cả 2 terminal windows MỞ khi chạy app! 🚀

