# 🐳 Docker Troubleshooting Guide

## Vấn đề phổ biến: "Docker Engine stopped"

### 🔍 Nguyên nhân thường gặp:
- Docker Desktop bị crash hoặc dừng đột ngột
- Hệ thống thiếu tài nguyên (RAM, CPU)
- Conflict với Hyper-V hoặc WSL2
- Corrupted Docker data
- Windows updates

### 🚀 Giải pháp nhanh:

#### 1. Sử dụng script tự động
```bash
# Kiểm tra trạng thái Docker
npm run docker:check

# Khắc phục tự động
npm run docker:fix

# Theo dõi trạng thái
npm run docker:monitor
```

#### 2. Các lệnh Docker cơ bản
```bash
# Khởi động containers
npm run docker:up

# Dừng containers
npm run docker:down

# Xem logs
npm run docker:logs

# Restart hoàn toàn
npm run docker:restart
```

### 🔧 Khắc phục thủ công:

#### Bước 1: Restart Docker Desktop
1. Mở Task Manager (Ctrl+Shift+Esc)
2. Tìm và kết thúc tất cả processes Docker
3. Mở Docker Desktop từ Start Menu
4. Chờ 1-2 phút để Docker khởi động

#### Bước 2: Xóa cache Docker
```cmd
# Xóa containers không sử dụng
docker system prune -a

# Xóa volumes không sử dụng
docker volume prune
```

#### Bước 3: Reset Docker Desktop
1. Right-click Docker icon trong system tray
2. Chọn "Troubleshoot"
3. Chọn "Reset to factory defaults"
4. Restart Docker Desktop

### 🛠️ Cấu hình tối ưu:

#### Docker Desktop Settings:
- **Memory**: Tối thiểu 4GB, khuyến nghị 8GB
- **CPU**: Tối thiểu 2 cores
- **Disk**: Tối thiểu 20GB free space

#### WSL2 Settings (nếu sử dụng):
```bash
# Tạo file .wslconfig trong C:\Users\[username]\
[wsl2]
memory=8GB
processors=4
swap=2GB
```

### 🚨 Lỗi thường gặp:

#### "Docker daemon is not running"
```bash
# Giải pháp
npm run docker:fix
```

#### "Port already in use"
```bash
# Kiểm tra ports
npm run validate:ports

# Sửa port conflicts
npm run fix:ports
```

#### "Out of disk space"
```bash
# Dọn dẹp Docker
docker system prune -a --volumes

# Dọn dẹp toàn bộ
npm run clean:all
```

### 📊 Monitoring:

#### Script theo dõi tự động:
```bash
npm run docker:monitor
```

#### Kiểm tra resources:
```bash
# Xem Docker stats
docker stats

# Xem system info
docker system df
```

### 🔄 Workflow khắc phục:

1. **Kiểm tra** → `npm run docker:check`
2. **Khắc phục** → `npm run docker:fix`
3. **Khởi động** → `npm run docker:up`
4. **Kiểm tra** → `npm run docker:logs`
5. **Theo dõi** → `npm run docker:monitor`

### 📞 Hỗ trợ:

Nếu vẫn gặp vấn đề, hãy:
1. Chạy `npm run docker:check` và gửi output
2. Kiểm tra Docker Desktop logs
3. Restart máy tính nếu cần thiết

---

**Lưu ý**: Đảm bảo Docker Desktop được cập nhật lên phiên bản mới nhất.
