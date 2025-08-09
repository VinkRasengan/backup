# 🔒 Security Audit với npm audit

## 🚀 Quick Start

### Kiểm tra security nhanh
```bash
# Test nhanh
npm run security:test:quick

# Audit toàn diện
npm run security:audit

# Demo cách sử dụng
npm run security:demo
```

### Fix vulnerabilities
```bash
# Fix tự động
npm run security:fix

# Fix với force (cẩn thận)
npm run security:fix:force
```

## 📋 Các lệnh có sẵn

| Lệnh | Mô tả |
|------|-------|
| `npm run security:test:quick` | Test security nhanh |
| `npm run security:audit` | Audit toàn diện cho tất cả services |
| `npm run security:audit:critical` | Audit chỉ critical vulnerabilities |
| `npm run security:audit:high` | Audit high và critical vulnerabilities |
| `npm run security:audit:fix` | Audit + auto fix |
| `npm run security:scan` | Basic npm audit |
| `npm run security:fix` | Auto fix vulnerabilities |
| `npm run security:demo` | Demo cách sử dụng |

## 🎯 Các mức độ vulnerability

- **Critical** 🚨: Lỗ hổng nghiêm trọng nhất, cần fix ngay
- **High** ⚠️: Lỗ hổng cao, cần fix sớm  
- **Moderate** ⚠️: Lỗ hổng trung bình, nên fix
- **Low** ℹ️: Lỗ hổng thấp, có thể bỏ qua tạm thời

## 📊 Ví dụ kết quả

```bash
# ✅ Không có vulnerabilities
found 0 vulnerabilities

# ⚠️ Có vulnerabilities
found 3 vulnerabilities (1 low, 2 moderate)
  run `npm audit fix` to fix 2 of them.
  1 vulnerability requires manual review.
```

## 🔧 Cách fix

### 1. Auto-fix (Khuyến nghị)
```bash
npm audit fix
```

### 2. Manual fix
```bash
# Cập nhật package cụ thể
npm update package-name

# Cài version mới nhất
npm install package-name@latest
```

### 3. Force fix (Cẩn thận)
```bash
npm audit fix --force
```

## 📈 Monitoring

### Hàng ngày
```bash
npm run security:test:quick
```

### Hàng tuần  
```bash
npm run security:audit
```

### Trước release
```bash
npm run security:audit:critical
```

## 🛡️ Best Practices

1. **Chạy audit định kỳ**: Hàng tuần hoặc trước mỗi release
2. **Fix ngay**: Các vulnerabilities critical và high
3. **Cập nhật dependencies**: Thường xuyên update packages
4. **Sử dụng lock files**: Đảm bảo reproducible builds
5. **Integration CI/CD**: Tự động audit trong pipeline

## 📚 Tài liệu chi tiết

Xem file `docs/SECURITY_AUDIT_GUIDE.md` để biết thêm chi tiết về:
- Cách sử dụng npm audit
- Troubleshooting
- Integration với CI/CD
- Best practices

## 🚨 Troubleshooting

### Audit fails
```bash
# Kiểm tra network
npm config get registry

# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Fix không hoạt động
```bash
# Thử với force
npm audit fix --force

# Manual update
npm update
```

---

**Lưu ý**: Luôn kiểm tra security trước khi deploy production!
