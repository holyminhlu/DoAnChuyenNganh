# Open Learning Foundation

## Giới thiệu
Open Learning Foundation (OLF) là nền tảng website chia sẻ tài liệu và học tập trực tuyến, giúp người dùng dễ dàng tìm kiếm, chia sẻ tài liệu học tập, xem thông tin chi tiết, đánh giá tài liệu và quản lý bộ sưu tập cá nhân. Ứng dụng hướng tới việc tạo ra một cộng đồng học tập mở, nơi mọi người có thể chia sẻ và tiếp cận kiến thức một cách dễ dàng.

## Tính năng chính
- Tìm kiếm tài liệu theo môn học, mã học phần, tên tác giả, từ khóa
- Upload và chia sẻ tài liệu học tập (PDF, PPTX, DOCX, ZIP)
- Xem và tải xuống tài liệu
- Đánh giá và nhận xét tài liệu
- Quản lý bookmark và bộ sưu tập cá nhân
- Tìm kiếm nâng cao với nhiều bộ lọc
- Đăng ký, đăng nhập, quản lý thông tin cá nhân
- Quản trị viên quản lý tài liệu, người dùng

## Kiến trúc tổng quan
Dự án sử dụng kiến trúc microservices:
- **Frontend:** Vue.js (thư mục `client/olf`)
- **Backend:** Node.js, chia thành các service nhỏ: Auth, Document (thư mục `server/`)
- **API Gateway:** Trung gian giữa frontend và các service backend, xử lý xác thực, định tuyến, logging
- **Database:** MongoDB (EduShareDB)

```
[Client (Vue.js)] <-> [API Gateway] <-> [Auth | Document Services]
```

## Cài đặt & Chạy dự án
### Yêu cầu
- Node.js >= 14.x
- npm >= 6.x
- MongoDB (chạy tại localhost:27017)

### 1. Cài đặt Backend
```bash
cd server
# Cài đặt cho từng service
cd api-gateway && npm install && cd ..
cd auth-service && npm install && cd ..
cd document-service && npm install && cd ..
```

### 2. Cài đặt Frontend
```bash
cd client/olf
npm install
```

### 3. Khởi chạy Backend Services
Khởi chạy từng service một cách thủ công hoặc sử dụng script tự động:

#### Cách 1: Chạy từng service riêng biệt
```bash
# Terminal 1 - API Gateway
cd server/api-gateway
npm start

# Terminal 2 - Auth Service
cd server/auth-service
node index.js

# Terminal 3 - Document Service
cd server/document-service
node index.js
```

#### Cách 2: Sử dụng script (nếu có)
Kiểm tra file `START_SERVICES.md` trong thư mục `server/` để biết cách chạy tất cả services cùng lúc.

### 4. Chạy Frontend
```bash
cd client/olf
npm run serve
```

### 5. Truy cập ứng dụng
- Frontend: http://localhost:8080
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Document Service: http://localhost:3003

## Cấu trúc thư mục
```
OpenLearnFoundation/
  ├─ client/
  │   └─ olf/              # Frontend Vue.js
  │       ├─ src/
  │       │   ├─ components/    # Các component Vue
  │       │   ├─ views/         # Các trang view
  │       │   ├─ routes/        # Định nghĩa routes
  │       │   └─ utils/         # Các hàm tiện ích
  │       └─ public/            # Tài nguyên tĩnh
  └─ server/
      ├─ api-gateway/      # API Gateway
      ├─ auth-service/     # Xác thực người dùng
      ├─ document-service/ # Quản lý tài liệu
```

## Mô tả chi tiết các dịch vụ Backend

### **api-gateway**
- Định tuyến request từ frontend đến các service backend
- Xử lý xác thực, kiểm tra token, logging
- Đảm bảo bảo mật và phân tán tải
- Proxy routes cho các service: `/auth`, `/documents`, `/tours`, `/bookings`, `/discounts`, `/rating`

### **auth-service**
- Đăng ký, đăng nhập, xác thực người dùng bằng JWT
- Quản lý thông tin tài khoản, đổi mật khẩu
- Phân quyền người dùng (user, admin)
- Port: 3001

### **document-service**
- Upload và quản lý tài liệu (PDF, PPTX, DOCX, ZIP)
- Tìm kiếm và lọc tài liệu theo nhiều tiêu chí
- Quản lý metadata của tài liệu (tên, mô tả, môn học, tác giả, thumbnail)
- Tải xuống và xem tài liệu
- Bookmark và quản lý bộ sưu tập cá nhân
- Đánh giá và nhận xét tài liệu
- Port: 3003
- Database: MongoDB (EduShareDB)
- Collections: `TaiLieu`, `NguoiDung`

## Frontend

### **Công nghệ**
- Vue.js 3
- Vue Router
- Bootstrap 5
- Font Awesome
- AOS (Animate On Scroll)
- GSAP
- SweetAlert2

### **Cấu trúc**
- **components/**: Các component tái sử dụng (Header, Footer, DocumentCard, SearchBar, ...)
- **views/**: Các trang như Home, Documents, DocumentDetails, SignIn, SignUp, UserProfile, ...
- **routes/**: Định nghĩa các route
- **utils/**: Các hàm tiện ích (authAPI, eventBus, validate)
- **data/**: Dữ liệu mẫu (documentsData.json, homepageData.json)

### **Tính năng Frontend**
- Trang chủ với hero section và search bar
- Tìm kiếm tài liệu nâng cao
- Hiển thị danh sách tài liệu với cards
- Chi tiết tài liệu
- Upload tài liệu với preview
- Quản lý profile người dùng
- Đăng nhập/Đăng ký
- Responsive design

## Các định dạng tài liệu được hỗ trợ
- PDF (.pdf)
- PowerPoint (.pptx)
- Word (.docx)
- ZIP Archive (.zip)
- Hình ảnh thumbnail (PNG, JPG, WEBP)

## Hướng dẫn phát triển

### Thêm mới dịch vụ Backend
1. Tạo thư mục mới trong `server/`
2. Cấu trúc gồm: `controllers/`, `models/`, `routes/`, `index.js`, `package.json`
3. Đăng ký route tại API Gateway (`server/api-gateway/src/routes/proxyRoutes.js`)
4. Đảm bảo mỗi service có thể chạy độc lập

### Thêm mới component Frontend
1. Thêm file `.vue` vào `client/olf/src/components/` hoặc `views/`
2. Đăng ký route mới trong `src/routes/index.js` nếu là trang mới
3. Sử dụng eventBus hoặc Vuex (nếu mở rộng) để quản lý trạng thái

### Chạy từng service riêng biệt
- Ví dụ: `cd server/auth-service && node index.js`
- Có thể debug từng service độc lập

### Quản lý môi trường
- Sử dụng file `.env` cho biến môi trường (port, secret, MongoDB connection string, ...)
- Không commit thông tin nhạy cảm lên repository

## MongoDB Schema

### Collection: TaiLieu
```javascript
{
  tenTaiLieu: String,
  moTa: String,
  monHoc: String,
  maHocPhan: String,
  tacGia: String,
  filePath: String,
  thumbnailPath: String,
  nguoiTaiLen: String (userId),
  luotTai: Number,
  danhGia: Number,
  ngayTai: Date,
  theLoai: String,
  // ... các trường khác
}
```

### Collection: NguoiDung
```javascript
{
  hoTen: String,
  email: String,
  matKhau: String (hashed),
  vaiTro: String ('user' | 'admin'),
  // ... các trường khác
}
```

## API Endpoints chính

### Auth Service
- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập
- `GET /auth/profile` - Lấy thông tin người dùng
- `PUT /auth/profile` - Cập nhật thông tin

### Document Service
- `POST /documents/upload` - Upload tài liệu
- `GET /documents` - Lấy danh sách tài liệu
- `GET /documents/search` - Tìm kiếm tài liệu
- `GET /documents/:id` - Lấy chi tiết tài liệu
- `PUT /documents/:id` - Cập nhật tài liệu
- `DELETE /documents/:id` - Xóa tài liệu
- `POST /documents/:id/bookmark` - Bookmark tài liệu
- `GET /documents/bookmarked` - Lấy danh sách bookmark

## Tài liệu tham khảo
- [Hướng dẫn nhanh](QUICK_START.md)
- [Hướng dẫn Auth Service](AUTH_SETUP_GUIDE.md)
- [Hướng dẫn Document Service](DOCUMENT_SERVICE_GUIDE.md)
- [Cấu trúc dự án](PROJECT_TREE.md)

## Đóng góp & Liên hệ
- Đóng góp: Tạo Pull Request, Issue trên repository để báo lỗi hoặc đề xuất tính năng mới
- Liên hệ: holyminhlu1@gmail.com (Minh Lữ) - Sđt: 0983149203
- Mọi ý kiến đóng góp đều được trân trọng để hoàn thiện sản phẩm

---

**Bản quyền thuộc về Hồ Lý Minh Lữ sinh viên Công nghệ Thông Tin, Trường Kỹ thuật và Công nghệ, Trường Đại học Trà Vinh.**
