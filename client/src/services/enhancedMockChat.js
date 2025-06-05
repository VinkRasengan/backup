// Enhanced Mock Chat for Production - FactCheck AI
export const enhancedMockChat = {
  getResponse: (message) => {
    const lowerMessage = message.toLowerCase();

    // Phishing & Lừa đảo
    if (lowerMessage.includes('phishing') || lowerMessage.includes('lừa đảo') || lowerMessage.includes('email')) {
      return `🎣 **Nhận biết Email Phishing - FactCheck AI**

**🚨 Dấu hiệu cảnh báo:**
• **Địa chỉ gửi lạ**: vietcombank-security@gmail.com thay vì @vietcombank.com.vn
• **Tạo áp lực**: "Tài khoản sẽ bị khóa trong 24h"
• **Yêu cầu thông tin**: Ngân hàng KHÔNG BAO GIỜ hỏi mật khẩu qua email
• **Link rút gọn**: bit.ly, tinyurl thay vì domain chính thức
• **Lỗi chính tả**: "Ngân hàng Việt Com Bank" thay vì "Vietcombank"

**✅ Cách phòng chống:**
1. Luôn gõ trực tiếp website ngân hàng
2. Kiểm tra URL có HTTPS và tên miền chính xác
3. Gọi hotline ngân hàng để xác minh

**💡 Nhớ**: Khi nghi ngờ, đừng click!`;
    }
    
    // Mật khẩu & Bảo mật tài khoản
    if (lowerMessage.includes('mật khẩu') || lowerMessage.includes('password') || lowerMessage.includes('tài khoản')) {
      return `🔐 **Tạo Mật khẩu Siêu Mạnh - FactCheck AI**

**📏 Quy tắc vàng:**
• **Độ dài**: Tối thiểu 12 ký tự (khuyến nghị 16+)
• **Đa dạng**: Chữ HOA, thường, số, ký tự đặc biệt
• **Tránh**: Tên, ngày sinh, "123456", "password"
• **Unique**: Mỗi tài khoản 1 mật khẩu riêng

**💡 Công thức tạo mật khẩu:**
Câu dễ nhớ → Viết tắt → Thêm số & ký tự
"Tôi Yêu Việt Nam Từ Năm 1945!" → "TyVnTn1945!"

**🛡️ Bảo mật nâng cao:**
• **2FA**: Google Authenticator, SMS
• **Password Manager**: Bitwarden (miễn phí), 1Password
• **Kiểm tra**: haveibeenpwned.com

**⚠️ Cảnh báo**: Đổi mật khẩu ngay nếu có tin tức rò rỉ dữ liệu!`;
    }
    
    // Virus & Malware
    if (lowerMessage.includes('virus') || lowerMessage.includes('malware') || lowerMessage.includes('antivirus')) {
      return `🦠 **Chống Malware Hiệu Quả - FactCheck AI**

**🛡️ Phần mềm diệt virus tốt:**
• **Miễn phí**: Windows Defender (tích hợp), Avast
• **Trả phí**: Kaspersky, Bitdefender, Norton
• **Doanh nghiệp**: ESET, Trend Micro

**🚫 Cách phòng chống:**
• **Cập nhật**: Windows Update, phần mềm luôn mới nhất
• **Tải an toàn**: Chỉ từ website chính thức
• **Email**: Không mở file .exe, .zip từ người lạ
• **USB**: Quét virus trước khi sử dụng

**⚠️ Dấu hiệu nhiễm virus:**
• Máy chậm bất thường
• Popup quảng cáo liên tục
• File bị mã hóa (ransomware)
• Trình duyệt chuyển hướng lạ

**💾 Backup 3-2-1**: 3 bản sao, 2 thiết bị khác nhau, 1 offline`;
    }
    
    if (lowerMessage.includes('wifi') || lowerMessage.includes('mạng')) {
      return `📶 **Bảo mật WiFi:**

1. **Mã hóa WPA3**: Sử dụng WPA3 hoặc WPA2 cho router
2. **Mật khẩu mạnh**: Đặt mật khẩu WiFi phức tạp
3. **Tên mạng**: Không để tên mạng tiết lộ thông tin cá nhân
4. **WiFi công cộng**: Tránh truy cập tài khoản quan trọng
5. **VPN**: Sử dụng VPN khi kết nối WiFi công cộng

**Lưu ý**: Tắt tính năng tự động kết nối WiFi trên điện thoại.`;
    }
    
    if (lowerMessage.includes('mạng xã hội') || lowerMessage.includes('facebook') || lowerMessage.includes('social')) {
      return `📱 **Bảo mật Mạng xã hội:**

1. **Cài đặt riêng tư**: Chỉ bạn bè mới xem được thông tin
2. **Thông tin cá nhân**: Không chia sẻ số điện thoại, địa chỉ
3. **Bạn bè**: Chỉ kết bạn với người quen
4. **Link đáng ngờ**: Không click link lạ trong tin nhắn
5. **2FA**: Bật xác thực 2 bước

**Cảnh báo**: Lừa đảo qua tin nhắn giả mạo bạn bè rất phổ biến.`;
    }
    
    // Website & URL Security
    if (lowerMessage.includes('website') || lowerMessage.includes('link') || lowerMessage.includes('url') || lowerMessage.includes('kiểm tra')) {
      return `🔗 **Kiểm tra Website An toàn - FactCheck AI**

**🔍 Cách nhận biết website giả:**
• **URL**: amazon.com vs amaz0n.com (số 0 thay chữ o)
• **HTTPS**: Phải có khóa xanh 🔒 và https://
• **Thiết kế**: Website giả thường thiết kế thô sơ
• **Liên hệ**: Không có địa chỉ, số điện thoại rõ ràng
• **Lỗi chính tả**: Nhiều lỗi ngữ pháp, chính tả

**🛠️ Tools kiểm tra miễn phí:**
• **VirusTotal**: virustotal.com
• **Google Safe Browsing**: transparencyreport.google.com
• **URLVoid**: urlvoid.com
• **Sucuri**: sitecheck.sucuri.net

**💡 Mẹo hay**: Copy URL và paste vào VirusTotal trước khi truy cập

**🚨 Cảnh báo**: Nếu nghi ngờ, đừng nhập thông tin cá nhân!`;
    }
    
    // Default response
    return `🛡️ **Chào bạn! Tôi là FactCheck AI**

Tôi là chuyên gia bảo mật AI hàng đầu Việt Nam, chuyên phân tích mối đe dọa trực tuyến. Tôi có thể giúp bạn:

🎣 **Phishing & Lừa đảo**: Nhận biết email, tin nhắn giả mạo
🔐 **Mật khẩu**: Tạo mật khẩu siêu mạnh, quản lý an toàn
🦠 **Malware**: Phòng chống virus, ransomware hiệu quả
📶 **WiFi**: Bảo mật mạng không dây, VPN
📱 **Mạng xã hội**: Bảo vệ thông tin cá nhân Facebook, Zalo
🔗 **Kiểm tra URL**: Phân tích độ tin cậy website, link

**💡 Hỏi tôi về:**
• "Cách nhận biết email lừa đảo?"
• "Tạo mật khẩu mạnh như thế nào?"
• "Website này có an toàn không?"
• "Phần mềm diệt virus nào tốt?"

Bạn muốn tìm hiểu về vấn đề bảo mật nào? 🤔`;
  }
};

export default enhancedMockChat;
