# 🚀 FactCheck Anti-Fraud Platform - Hướng Dẫn Sử Dụng

## 📋 Mục Lục

1. [Giới Thiệu](#giới-thiệu)
2. [Video Hướng Dẫn](#video-hướng-dẫn)
3. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
4. [Cài Đặt và Thiết Lập](#cài-đặt-và-thiết-lập)
5. [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
6. [Tính Năng Chính](#tính-năng-chính)
7. [Cộng Đồng và Tương Tác](#cộng-đồng-và-tương-tác)
8. [Bảo Mật và Quyền Riêng Tư](#bảo-mật-và-quyền-riêng-tư)
9. [Xử Lý Sự Cố](#xử-lý-sự-cố)
10. [Liên Hệ Hỗ Trợ](#liên-hệ-hỗ-trợ)

---

## 🎯 Giới Thiệu

**FactCheck Anti-Fraud Platform** là một nền tảng kiểm chứng thông tin tiên tiến, sử dụng công nghệ AI và cộng đồng để giúp người dùng phân biệt thông tin thật giả trên internet. Hệ thống cung cấp các công cụ mạnh mẽ để kiểm tra độ tin cậy của các liên kết, bài viết và nguồn thông tin.

### ✨ Tính Năng Nổi Bật:
- 🔍 **Kiểm tra link thông minh** với phân tích đa lớp
- 🤖 **AI hỗ trợ** với Google Gemini
- 👥 **Cộng đồng kiểm chứng** thông tin
- 📊 **Báo cáo chi tiết** về độ tin cậy
- 🛡️ **Bảo mật cao** với nhiều lớp kiểm tra
- 📱 **Giao diện hiện đại** và dễ sử dụng
- ⚡ **Hiệu suất cao** với kiến trúc microservices
- 🔄 **Cập nhật thời gian thực** với event-driven architecture

---

## 🎥 Video Hướng Dẫn

**📺 Xem video hướng dẫn chi tiết cách sử dụng hệ thống:**

[![FactCheck Platform Tutorial](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

**🔗 Link trực tiếp:** https://www.youtube.com/watch?v=YOUR_VIDEO_ID

*Video này sẽ hướng dẫn bạn từng bước cách sử dụng tất cả các tính năng của FactCheck Platform, bao gồm kiểm tra link, tham gia cộng đồng, và sử dụng trợ lý AI.*

---

## 💻 Yêu Cầu Hệ Thống

### 📋 Yêu Cầu Tối Thiểu:
- **Hệ điều hành:** Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Trình duyệt:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Kết nối internet:** Ổn định, tốc độ tối thiểu 2Mbps
- **RAM:** 4GB (khuyến nghị 8GB+)
- **Dung lượng ổ cứng:** 1GB trống

### 🚀 Yêu Cầu Khuyến Nghị:
- **Trình duyệt:** Chrome 100+ hoặc Firefox 100+
- **Kết nối internet:** 10Mbps+
- **RAM:** 8GB+
- **Màn hình:** Độ phân giải 1920x1080+
- **Node.js:** 18+ (cho developer setup)

---

## 🔧 Cài Đặt và Thiết Lập

### 🌐 Phương Pháp 1: Sử Dụng Trực Tuyến (Khuyến Nghị)

**Bước 1:** Truy cập website chính thức
```
https://factcheck-platform.com
```

**Bước 2:** Đăng ký tài khoản miễn phí
- Nhấp vào nút "Đăng Ký" ở góc trên bên phải
- Điền thông tin cá nhân
- Xác minh email

**Bước 3:** Bắt đầu sử dụng ngay lập tức

### 💻 Phương Pháp 2: Cài Đặt Local (Cho Developer)

#### **Bước 1: Cài đặt các công cụ cần thiết**

**Node.js 18+:**
```bash
# Windows: Tải từ https://nodejs.org/
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
```

**Docker Desktop:**
```bash
# Windows/macOS: Tải từ https://www.docker.com/products/docker-desktop/
# Ubuntu: sudo apt install docker.io docker-compose
```

#### **Bước 2: Clone repository**
```bash
git clone https://github.com/VinkRasengan/backup.git
cd backup
```

#### **Bước 3: Cài đặt dependencies**
```bash
npm run install:all
```

#### **Bước 4: Cấu hình môi trường**
```bash
cp .env.example .env
# Chỉnh sửa file .env với thông tin Firebase của bạn
```

#### **Bước 5: Khởi chạy hệ thống**
```bash
npm start
```

#### **Bước 6: Truy cập ứng dụng**
- **Frontend:** http://localhost:3000
- **API Gateway:** http://localhost:8080

### 🐳 Phương Pháp 3: Docker Deployment

```bash
# Khởi chạy với Docker
npm run docker:start

# Hoặc sử dụng Docker Compose trực tiếp
docker-compose up --build -d
```

---

## 🚀 Hướng Dẫn Sử Dụng

### 🔐 Đăng Ký và Đăng Nhập

#### **Đăng Ký Tài Khoản**

1. **Truy cập trang đăng ký**
   - Nhấp vào "Đăng Ký" trên trang chủ
   - Hoặc truy cập trực tiếp: `/register`

2. **Điền thông tin cá nhân**
   - Email (bắt buộc)
   - Mật khẩu (tối thiểu 8 ký tự)
   - Họ và tên
   - Số điện thoại (tùy chọn)

3. **Xác minh email**
   - Kiểm tra hộp thư email
   - Nhấp vào link xác minh
   - Hoặc nhập mã xác minh

4. **Hoàn tất đăng ký**
   - Điền thông tin bổ sung (nếu có)
   - Chọn avatar và cài đặt ban đầu

#### **Đăng Nhập**

1. **Truy cập trang đăng nhập**
   - Nhấp vào "Đăng Nhập" trên trang chủ
   - Hoặc truy cập trực tiếp: `/login`

2. **Nhập thông tin đăng nhập**
   - Email đã đăng ký
   - Mật khẩu

3. **Tùy chọn bổ sung**
   - "Ghi nhớ đăng nhập" (30 ngày)
   - "Đăng nhập bằng Google" (nếu có)

### 🏠 Giao Diện Chính

Sau khi đăng nhập, bạn sẽ thấy các tab chính:

- **🏠 Trang Chủ:** Tổng quan và thống kê
- **🔍 Kiểm Tra Link:** Công cụ kiểm tra chính
- **👥 Cộng Đồng:** Thảo luận và chia sẻ
- **💬 Chat AI:** Trợ lý thông minh
- **📊 Dashboard:** Báo cáo và phân tích
- **⚙️ Cài Đặt:** Tùy chỉnh tài khoản

### 🔍 Kiểm Tra Link

#### **Bước 1: Truy cập trang kiểm tra**
- Nhấp vào tab "Kiểm Tra Link"
- Hoặc sử dụng thanh tìm kiếm trên trang chủ

#### **Bước 2: Nhập URL cần kiểm tra**
- Dán link trực tiếp vào ô tìm kiếm
- Hoặc nhấp vào biểu tượng clipboard để dán từ bộ nhớ
- Hệ thống tự động chuẩn hóa URL

#### **Bước 3: Xem kết quả phân tích**
Hệ thống sẽ hiển thị:

**📊 Điểm số tổng quan:**
- Điểm tin cậy (0-100)
- Điểm bảo mật (0-100)
- Điểm cuối cùng (0-100)

**🔍 Chi tiết phân tích:**
- Kiểm tra malware
- Kiểm tra phishing
- Đánh giá nguồn tin
- Phân tích nội dung
- So sánh với cơ sở dữ liệu fact-checking

**⚠️ Cảnh báo:**
- Mức độ rủi ro
- Khuyến nghị hành động
- Thông tin bổ sung

#### **Bước 4: Tương tác với kết quả**
- **Vote:** Đánh giá độ chính xác
- **Bình luận:** Chia sẻ ý kiến
- **Báo cáo:** Báo cáo nếu có vấn đề
- **Chia sẻ:** Chia sẻ kết quả với người khác

### 🤖 Sử Dụng Trợ Lý AI

#### **Truy cập Chat AI**
- Nhấp vào tab "Chat AI"
- Hoặc sử dụng biểu tượng chat ở góc dưới bên phải

#### **Tương tác với AI**
1. **Đặt câu hỏi** về bất kỳ chủ đề nào
2. **Yêu cầu phân tích** thông tin cụ thể
3. **Hỏi về fact-checking** và kiểm chứng thông tin
4. **Nhận hướng dẫn** sử dụng hệ thống

#### **Tính năng AI nâng cao**
- **Phân tích ngữ cảnh:** AI hiểu ngữ cảnh câu hỏi
- **Gợi ý thông minh:** Đề xuất câu hỏi liên quan
- **Tóm tắt thông tin:** Tạo bản tóm tắt ngắn gọn
- **Dịch thuật:** Hỗ trợ đa ngôn ngữ

---

## ⚡ Tính Năng Chính

### 1. 🔍 Kiểm Tra Link Thông Minh

**Công nghệ sử dụng:**
- VirusTotal API
- ScamAdviser API
- IPQualityScore API
- ScreenshotLayer API
- Google Gemini AI

**Quy trình kiểm tra:**
1. **Thu thập thông tin:** URL, domain, metadata
2. **Phân tích bảo mật:** Malware, phishing, spam
3. **Đánh giá nguồn:** Uy tín, lịch sử, danh tiếng
4. **Phân tích nội dung:** AI đánh giá nội dung
5. **So sánh cơ sở dữ liệu:** Fact-checking databases
6. **Tính điểm tổng hợp:** Thuật toán đánh giá

### 2. 👥 Cộng Đồng Kiểm Chứng

**Tính năng cộng đồng:**
- **Đăng bài:** Chia sẻ thông tin cần kiểm chứng
- **Vote:** Đánh giá độ chính xác
- **Bình luận:** Thảo luận và phân tích
- **Báo cáo:** Báo cáo nội dung sai lệch
- **Thành tích:** Hệ thống điểm và huy hiệu

**Quy tắc cộng đồng:**
- Tôn trọng lẫn nhau
- Không spam hoặc quảng cáo
- Cung cấp bằng chứng khi có thể
- Báo cáo nội dung vi phạm

### 3. 🏆 Hệ Thống Thành Tích

**Các loại thành tích:**
- 🥇 **Kiểm chứng viên:** Số lần kiểm tra thành công
- 🏆 **Cộng đồng:** Đóng góp tích cực
- 🎯 **Chính xác:** Độ chính xác trong đánh giá
- ⚡ **Nhanh nhẹn:** Thời gian phản hồi nhanh
- 🛡️ **Bảo vệ:** Báo cáo nội dung độc hại

### 4. 📊 Báo Cáo và Thống Kê

**Thống kê cá nhân:**
- Số link đã kiểm tra
- Độ chính xác trung bình
- Thời gian sử dụng
- Thành tích đạt được

**Thống kê cộng đồng:**
- Xu hướng kiểm chứng
- Top nguồn tin đáng tin cậy
- Cảnh báo thông tin sai lệch
- Báo cáo hàng tuần/tháng

---

## 👥 Cộng Đồng và Tương Tác

### 🎯 Tham Gia Cộng Đồng

#### **Đăng Bài**
1. Nhấp vào "Đăng bài mới"
2. Chọn loại bài đăng:
   - **Kiểm chứng thông tin:** Yêu cầu kiểm tra
   - **Chia sẻ kinh nghiệm:** Kinh nghiệm fact-checking
   - **Thảo luận:** Chủ đề liên quan
   - **Cảnh báo:** Thông tin cần cảnh giác

3. Viết nội dung:
   - Tiêu đề rõ ràng
   - Mô tả chi tiết
   - Đính kèm bằng chứng (nếu có)
   - Gắn thẻ phù hợp

#### **Tương Tác**
- **Vote:** Thích/không thích bài viết
- **Bình luận:** Thảo luận và phân tích
- **Chia sẻ:** Chia sẻ với người khác
- **Báo cáo:** Báo cáo nội dung vi phạm

### 📋 Quy Tắc Cộng Đồng

**✅ Nên làm:**
- Tôn trọng ý kiến của người khác
- Cung cấp bằng chứng khi có thể
- Sử dụng ngôn ngữ lịch sự
- Báo cáo nội dung vi phạm
- Đóng góp tích cực cho cộng đồng

**❌ Không nên:**
- Spam hoặc quảng cáo
- Đăng nội dung độc hại
- Tấn công cá nhân
- Phát tán thông tin sai lệch
- Vi phạm bản quyền

### 🏅 Hệ Thống Điểm

**Cách tính điểm:**
- **Đăng bài:** +5 điểm
- **Bình luận hữu ích:** +2 điểm
- **Vote chính xác:** +1 điểm
- **Báo cáo được chấp nhận:** +10 điểm
- **Vi phạm quy tắc:** -20 điểm

**Cấp độ thành viên:**
- 🥉 **Mới:** 0-100 điểm
- 🥈 **Thành viên:** 101-500 điểm
- 🥇 **Kiểm chứng viên:** 501-1000 điểm
- 👑 **Chuyên gia:** 1000+ điểm

---

## 🛡️ Bảo Mật và Quyền Riêng Tư

### 🔒 Bảo Mật Dữ Liệu

**Mã hóa dữ liệu:**
- Tất cả dữ liệu được mã hóa SSL/TLS
- Mật khẩu được hash bảo mật
- Thông tin cá nhân được bảo vệ

**Kiểm tra bảo mật:**
- Quét malware tự động
- Phát hiện phishing
- Cảnh báo link độc hại
- Bảo vệ khỏi tấn công

### 🔐 Quyền Riêng Tư

**Thông tin thu thập:**
- Email (để đăng ký và liên lạc)
- Tên (hiển thị công khai)
- Hoạt động sử dụng (để cải thiện dịch vụ)

**Thông tin KHÔNG thu thập:**
- Mật khẩu (chỉ hash)
- Thông tin tài chính
- Dữ liệu cá nhân nhạy cảm

**Kiểm soát quyền riêng tư:**
- Ẩn/hiện thông tin cá nhân
- Xóa tài khoản
- Xuất dữ liệu cá nhân
- Tắt thông báo

### ⚙️ Cài Đặt Bảo Mật

**Bảo mật tài khoản:**
1. Sử dụng mật khẩu mạnh
2. Bật xác thực 2 yếu tố (nếu có)
3. Đăng xuất khi không sử dụng
4. Kiểm tra hoạt động đăng nhập

**Bảo mật trình duyệt:**
1. Cập nhật trình duyệt thường xuyên
2. Sử dụng HTTPS
3. Không chia sẻ thông tin đăng nhập
4. Cẩn thận với link lạ

---

## 🔧 Xử Lý Sự Cố

### ❗ Vấn Đề Thường Gặp

#### **1. Không thể đăng nhập**
**Nguyên nhân có thể:**
- Sai email hoặc mật khẩu
- Tài khoản chưa xác minh email
- Tài khoản bị khóa

**Cách khắc phục:**
1. Kiểm tra lại thông tin đăng nhập
2. Xác minh email đã được xác nhận
3. Sử dụng "Quên mật khẩu"
4. Liên hệ hỗ trợ nếu cần

#### **2. Kiểm tra link không hoạt động**
**Nguyên nhân có thể:**
- Link không hợp lệ
- Website đã bị xóa
- Lỗi kết nối internet
- Hệ thống đang bảo trì

**Cách khắc phục:**
1. Kiểm tra lại URL
2. Thử lại sau vài phút
3. Kiểm tra kết nối internet
4. Thử link khác

#### **3. Trang web chậm hoặc không tải**
**Nguyên nhân có thể:**
- Kết nối internet chậm
- Trình duyệt cũ
- Cache trình duyệt đầy
- Hệ thống quá tải

**Cách khắc phục:**
1. Kiểm tra tốc độ internet
2. Cập nhật trình duyệt
3. Xóa cache và cookie
4. Thử trình duyệt khác

#### **4. Không nhận được email xác minh**
**Nguyên nhân có thể:**
- Email bị gửi vào spam
- Sai địa chỉ email
- Lỗi hệ thống email

**Cách khắc phục:**
1. Kiểm tra thư mục spam
2. Kiểm tra lại địa chỉ email
3. Yêu cầu gửi lại email
4. Liên hệ hỗ trợ

### 🐛 Lỗi Kỹ Thuật

#### **Mã lỗi thường gặp:**
- **404:** Trang không tồn tại
- **500:** Lỗi máy chủ
- **403:** Không có quyền truy cập
- **429:** Quá nhiều yêu cầu

#### **Cách báo cáo lỗi:**
1. Ghi lại mã lỗi
2. Chụp màn hình lỗi
3. Mô tả các bước gây lỗi
4. Gửi báo cáo qua email hoặc chat

### 🔧 Troubleshooting cho Developer

#### **Lệnh hữu ích:**
```bash
# Kiểm tra trạng thái hệ thống
npm run status

# Khởi động lại hệ thống
npm restart

# Xem logs
npm run logs

# Sửa lỗi port
npm run fix-ports

# Dọn dẹp hệ thống
npm run clean
```

#### **Kiểm tra health:**
```bash
# Health check tổng quát
npm run health

# Kiểm tra từng service
curl http://localhost:8080/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## 📞 Liên Hệ Hỗ Trợ

### 🎯 Kênh Hỗ Trợ

#### **1. Chat Trực Tuyến**
- **Thời gian:** 24/7
- **Truy cập:** Biểu tượng chat ở góc dưới bên phải
- **Phản hồi:** Trong vòng 5 phút

#### **2. Email Hỗ Trợ**
- **Địa chỉ:** support@factcheck.ai
- **Thời gian phản hồi:** 24 giờ
- **Phù hợp cho:** Vấn đề phức tạp, báo cáo lỗi

#### **3. Hotline**
- **Số điện thoại:** 1900-1234 (miễn phí)
- **Thời gian:** 8:00 - 22:00 (GMT+7)
- **Phù hợp cho:** Hỗ trợ khẩn cấp

#### **4. Trang Trợ Giúp**
- **Truy cập:** /help
- **Nội dung:** FAQ, hướng dẫn chi tiết
- **Tìm kiếm:** Tìm câu trả lời nhanh

### 📧 Thông Tin Liên Hệ

**Địa chỉ:** 
```
FactCheck Platform
123 Đường ABC, Quận XYZ
TP. Hồ Chí Minh, Việt Nam
```

**Email:**
- Hỗ trợ: support@factcheck.ai
- Kinh doanh: business@factcheck.ai
- Báo chí: press@factcheck.ai

**Mạng xã hội:**
- Facebook: @FactCheckPlatform
- Twitter: @FactCheckVN
- LinkedIn: FactCheck Platform

### 💬 Phản Hồi và Đóng Góp

**Gửi phản hồi:**
- Sử dụng form phản hồi trên website
- Email đến feedback@factcheck.ai
- Thông qua cộng đồng

**Đóng góp:**
- Báo cáo lỗi
- Đề xuất tính năng mới
- Tham gia beta testing
- Đóng góp nội dung

---

## 🎯 Kết Luận

FactCheck Platform là công cụ mạnh mẽ giúp bạn kiểm chứng thông tin một cách chính xác và nhanh chóng. Với sự kết hợp giữa công nghệ AI tiên tiến và cộng đồng kiểm chứng, chúng tôi cam kết cung cấp một môi trường an toàn và đáng tin cậy để đánh giá thông tin trên internet.

**Hãy bắt đầu sử dụng ngay hôm nay để trở thành một người tiêu dùng thông tin thông minh!**

---

## 📋 Quick Commands Reference

### 🚀 Development Commands

#### **Start Full Stack (Recommended)**
```bash
npm start
```
- Starts ALL services + React client
- Takes 30-60 seconds to fully start
- Opens everything you need for development

#### **Start Services Only (Backend Development)**
```bash
npm run dev
```
- Starts ONLY backend services (no client)
- Faster startup
- Good for backend development

#### **Stop Everything**
```bash
npm stop
```
- Stops all services and client
- Kills all Node.js processes
- Stops Redis container

#### **Restart Everything**
```bash
npm restart
```
- Stops then starts full stack
- Good for applying config changes

### 🐳 Deployment Commands

#### **Docker Deployment**
```bash
npm run docker:start
```
- Builds and starts with Docker Compose
- Includes Redis, monitoring, all services
- Production-like environment

#### **Kubernetes Deployment**
```bash
npm run deploy:k8s
```
- Deploys to Kubernetes cluster
- Requires kubectl configured

### 🧪 Testing Commands

#### **All Tests**
```bash
npm test
```
- Runs unit + contract + integration tests

#### **Specific Test Types**
```bash
npm run test:unit         # Unit tests only
npm run test:contract     # Contract tests only  
npm run test:integration  # Integration tests only
```

### 📊 Monitoring Commands

#### **System Status**
```bash
npm run status
```
- Shows status of all services
- Checks tech stack components
- Health check summary

#### **Detailed Health Check**
```bash
npm run health
```
- Same as status but more detailed

#### **View Logs**
```bash
npm run logs
```
- Shows logs from all services
- Works with Docker deployment

### 🛠️ Utility Commands

#### **Fix Port Conflicts**
```bash
npm run fix-ports
```
- Kills processes using required ports
- Useful when services won't start

#### **Clean Everything**
```bash
npm run clean
```
- Stops all services
- Removes Docker containers
- Cleans up resources

#### **Get Help**
```bash
npm run help
```
- Shows all available commands
- Detailed usage information

---

## 🌐 Access URLs

After running `npm start`:

- **Frontend:** http://localhost:3000
- **API Gateway:** http://localhost:8080
- **Auth Service:** http://localhost:3001
- **Link Service:** http://localhost:3002
- **Community Service:** http://localhost:3003
- **Chat Service:** http://localhost:3004
- **News Service:** http://localhost:3005
- **Admin Service:** http://localhost:3006
- **Redis:** localhost:6379

---

*Tài liệu này được cập nhật lần cuối: [Ngày hiện tại]*  
*Phiên bản: 2.0*  
*© 2024 FactCheck Platform. Tất cả quyền được bảo lưu.*
