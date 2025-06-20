# 🚀 Quick Deploy Guide

## 🎯 Tóm tắt nhanh

Bạn có **2 cách chính** để deploy:

### 🔥 Cách 1: Tự động với GitHub Actions (Khuyến nghị)
```powershell
# 1. Push code lên GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Chạy script tự động
.\deploy-to-render.ps1
```

### 🔥 Cách 2: Manual deploy trên Render
1. Vào https://render.com
2. Connect GitHub repo
3. Chọn Blueprint deployment với file `render.yaml`
4. Cấu hình environment variables

## ⚡ Checklist trước khi deploy

- [ ] Code đã test local OK
- [ ] Firebase project đã setup
- [ ] File `render.yaml` đã có
- [ ] Environment variables đã cấu hình
- [ ] Repository đã push lên GitHub

## 🌐 Kết quả sau khi deploy

Bạn sẽ có các URL:
- **Frontend**: `https://factcheck-client.onrender.com`
- **API Gateway**: `https://factcheck-api-gateway.onrender.com`
- **Services**: `https://factcheck-[service-name].onrender.com`

## 🆘 Cần hỗ trợ?

1. Kiểm tra **GitHub Actions** logs
2. Kiểm tra **Render Dashboard** 
3. Xem file `DEPLOYMENT_GUIDE.md` để có hướng dẫn chi tiết hơn

---
💡 **Lưu ý**: Lần đầu deploy có thể mất 10-15 phút. Render free tier có thể sleep nếu không sử dụng 30 phút.
