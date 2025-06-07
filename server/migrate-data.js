// Comprehensive Data Migration to Firestore
require('dotenv').config({ path: '../.env' });
const admin = require('firebase-admin');

console.log('🚀 Starting comprehensive data migration to Firestore...');

// Initialize Firebase
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

const db = admin.firestore();

// Enhanced Users Data
const users = [
    {
        id: 'user1',
        email: 'admin@factcheck.com',
        displayName: 'Dr. Nguyễn Văn A',
        firstName: 'Nguyễn Văn',
        lastName: 'A',
        isVerified: true,
        authProvider: 'backend',
        bio: 'Chuyên gia y tế, bác sĩ đa khoa với 15 năm kinh nghiệm',
        avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100',
        role: 'expert',
        stats: { linksChecked: 45, chatMessages: 120, postsCreated: 8 },
        specialization: 'medical',
        createdAt: admin.firestore.Timestamp.now(),
        lastLoginAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'user2',
        email: 'security@factcheck.com',
        displayName: 'Trần Thị B',
        firstName: 'Trần Thị',
        lastName: 'B',
        isVerified: true,
        authProvider: 'firebase',
        bio: 'Chuyên gia bảo mật mạng, phát hiện và ngăn chặn lừa đảo trực tuyến',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
        role: 'security_expert',
        stats: { linksChecked: 67, chatMessages: 89, postsCreated: 12 },
        specialization: 'cybersecurity',
        createdAt: admin.firestore.Timestamp.now(),
        lastLoginAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'user3',
        email: 'tech@factcheck.com',
        displayName: 'Lê Văn C',
        firstName: 'Lê Văn',
        lastName: 'C',
        isVerified: true,
        authProvider: 'firebase',
        bio: 'Chuyên gia công nghệ, phân tích ứng dụng và website độc hại',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        role: 'tech_expert',
        stats: { linksChecked: 34, chatMessages: 56, postsCreated: 6 },
        specialization: 'technology',
        createdAt: admin.firestore.Timestamp.now(),
        lastLoginAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'user4',
        email: 'community@factcheck.com',
        displayName: 'Phạm Thị D',
        firstName: 'Phạm Thị',
        lastName: 'D',
        isVerified: false,
        authProvider: 'firebase',
        bio: 'Thành viên cộng đồng tích cực, chia sẻ thông tin hữu ích',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        role: 'community',
        stats: { linksChecked: 23, chatMessages: 45, postsCreated: 4 },
        specialization: 'general',
        createdAt: admin.firestore.Timestamp.now(),
        lastLoginAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'user5',
        email: 'vnexpress@factcheck.com',
        displayName: 'VnExpress',
        firstName: 'VnExpress',
        lastName: 'News',
        isVerified: true,
        authProvider: 'backend',
        bio: 'Trang tin tức hàng đầu Việt Nam, cung cấp thông tin chính xác và kịp thời',
        avatarUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100',
        role: 'media',
        stats: { linksChecked: 156, chatMessages: 12, postsCreated: 45 },
        specialization: 'journalism',
        createdAt: admin.firestore.Timestamp.now(),
        lastLoginAt: admin.firestore.Timestamp.now()
    }
];

// Enhanced Community Posts
const posts = [
    {
        id: 'post1',
        url: 'https://example.com/covid-vaccine-misinformation',
        title: 'Cảnh báo: Tin giả về vaccine COVID-19 lan truyền trên mạng xã hội',
        description: 'Các chuyên gia y tế cảnh báo về việc lan truyền thông tin sai lệch về vaccine COVID-19. Những tin đồn này có thể gây nguy hiểm cho sức khỏe cộng đồng.',
        status: 'safe',
        category: 'health',
        submittedBy: 'user1',
        scanResults: {
            virusTotal: { positives: 0, total: 70, scanDate: new Date().toISOString() },
            sslCheck: { valid: true, issuer: 'Let\'s Encrypt', expiryDate: '2025-12-31' },
            domainAge: { years: 5, trustScore: 85 },
            contentAnalysis: { factChecked: true, sources: ['WHO', 'CDC'] }
        },
        imageUrl: 'https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=400',
        tags: ['covid-19', 'vaccine', 'y-te', 'tin-gia'],
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'post2',
        url: 'https://suspicious-bank-site.com',
        title: 'Phát hiện website giả mạo ngân hàng lừa đảo',
        description: 'Website giả mạo Vietcombank với domain tương tự đang lừa đảo người dùng. Cảnh báo mọi người không truy cập và cung cấp thông tin.',
        status: 'unsafe',
        category: 'security',
        submittedBy: 'user2',
        scanResults: {
            virusTotal: { positives: 25, total: 70, scanDate: new Date().toISOString() },
            sslCheck: { valid: false, error: 'Certificate mismatch' },
            domainAge: { days: 15, trustScore: 5 },
            contentAnalysis: { phishing: true, similarity: 95 }
        },
        imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
        tags: ['ngan-hang', 'lua-dao', 'website-gia', 'bao-mat'],
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'post3',
        url: 'https://legitimate-news-source.com/climate-change',
        title: 'Nghiên cứu mới về biến đổi khí hậu từ NASA',
        description: 'NASA công bố nghiên cứu mới về tác động của biến đổi khí hậu đến hệ sinh thái toàn cầu. Dữ liệu được thu thập từ vệ tinh trong 10 năm qua.',
        status: 'safe',
        category: 'science',
        submittedBy: 'user3',
        scanResults: {
            virusTotal: { positives: 0, total: 70, scanDate: new Date().toISOString() },
            sslCheck: { valid: true, issuer: 'DigiCert', expiryDate: '2025-08-15' },
            domainAge: { years: 12, trustScore: 95 },
            contentAnalysis: { factChecked: true, sources: ['NASA', 'NOAA'] }
        },
        imageUrl: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400',
        tags: ['khoa-hoc', 'nasa', 'khi-hau', 'nghien-cuu'],
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'post4',
        url: 'https://fake-crypto-investment.scam',
        title: 'Cảnh báo: Sàn giao dịch tiền điện tử giả mạo',
        description: 'Phát hiện sàn giao dịch tiền điện tử giả mạo hứa hẹn lợi nhuận cao. Đã có nhiều người bị lừa mất tiền.',
        status: 'unsafe',
        category: 'finance',
        submittedBy: 'user2',
        scanResults: {
            virusTotal: { positives: 18, total: 70, scanDate: new Date().toISOString() },
            sslCheck: { valid: false, error: 'Self-signed certificate' },
            domainAge: { days: 7, trustScore: 2 },
            contentAnalysis: { scam: true, ponziScheme: true }
        },
        imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400',
        tags: ['tien-dien-tu', 'lua-dao', 'dau-tu', 'san-giao-dich'],
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'post5',
        url: 'https://vnexpress.net/fake-wallet-apps-warning',
        title: 'Cảnh báo ứng dụng giả mạo ví điện tử trên CH Play',
        description: 'Google đã gỡ bỏ hàng chục ứng dụng giả mạo các ví điện tử phổ biến tại Việt Nam. Người dùng cần cẩn thận khi tải ứng dụng.',
        status: 'safe',
        category: 'technology',
        submittedBy: 'user5',
        scanResults: {
            virusTotal: { positives: 0, total: 70, scanDate: new Date().toISOString() },
            sslCheck: { valid: true, issuer: 'CloudFlare', expiryDate: '2025-10-20' },
            domainAge: { years: 8, trustScore: 92 },
            contentAnalysis: { factChecked: true, sources: ['Google', 'VnExpress'] }
        },
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        tags: ['vi-dien-tu', 'ung-dung-gia', 'ch-play', 'bao-mat'],
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.now()
    }
];

// Votes data
const votes = [
    { id: 'vote1', linkId: 'post1', userId: 'user2', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote2', linkId: 'post1', userId: 'user3', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote3', linkId: 'post1', userId: 'user4', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote4', linkId: 'post2', userId: 'user1', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote5', linkId: 'post2', userId: 'user3', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote6', linkId: 'post2', userId: 'user4', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote7', linkId: 'post3', userId: 'user1', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote8', linkId: 'post3', userId: 'user2', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote9', linkId: 'post4', userId: 'user1', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote10', linkId: 'post4', userId: 'user3', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote11', linkId: 'post5', userId: 'user1', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
    { id: 'vote12', linkId: 'post5', userId: 'user2', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() }
];

// Comments data
const comments = [
    {
        id: 'comment1',
        linkId: 'post1',
        userId: 'user2',
        content: 'Cảm ơn bác sĩ đã chia sẻ thông tin chính xác về vaccine. Rất hữu ích!',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'comment2',
        linkId: 'post2',
        userId: 'user1',
        content: 'Tôi cũng từng gặp website này. Rất nguy hiểm, mọi người cẩn thận!',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'comment3',
        linkId: 'post3',
        userId: 'user4',
        content: 'Nghiên cứu từ NASA luôn đáng tin cậy. Cảm ơn đã chia sẻ!',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'comment4',
        linkId: 'post4',
        userId: 'user3',
        content: 'Đã báo cáo website này cho cơ quan chức năng. Mọi người tránh xa!',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'comment5',
        linkId: 'post5',
        userId: 'user4',
        content: 'VnExpress luôn cập nhật tin tức bảo mật kịp thời. Cảm ơn!',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    }
];

// Conversations data
const conversations = [
    {
        id: 'conv1',
        userId: 'user1',
        title: 'Cách nhận biết email lừa đảo',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'conv2',
        userId: 'user2',
        title: 'Bảo mật thông tin cá nhân',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'conv3',
        userId: 'user3',
        title: 'Phân tích website độc hại',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    }
];

// Chat messages data
const chatMessages = [
    {
        id: 'msg1',
        conversationId: 'conv1',
        userId: 'user1',
        content: 'Làm thế nào để nhận biết email lừa đảo?',
        role: 'user',
        createdAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'msg2',
        conversationId: 'conv1',
        userId: 'user1',
        content: 'Để nhận biết email lừa đảo, bạn cần chú ý:\n\n1. **Kiểm tra địa chỉ gửi**: Email lừa đảo thường có địa chỉ gửi lạ hoặc giả mạo\n2. **Nội dung khẩn cấp**: Thường tạo cảm giác khẩn cấp, yêu cầu hành động ngay\n3. **Liên kết đáng ngờ**: Hover chuột để xem URL thực tế\n4. **Yêu cầu thông tin**: Không bao giờ cung cấp mật khẩu qua email\n5. **Lỗi chính tả**: Email lừa đảo thường có nhiều lỗi ngữ pháp',
        role: 'assistant',
        createdAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'msg3',
        conversationId: 'conv2',
        userId: 'user2',
        content: 'Cách bảo vệ thông tin cá nhân trên mạng?',
        role: 'user',
        createdAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'msg4',
        conversationId: 'conv2',
        userId: 'user2',
        content: 'Để bảo vệ thông tin cá nhân:\n\n🔐 **Mật khẩu mạnh**:\n- Tối thiểu 12 ký tự\n- Kết hợp chữ hoa, thường, số, ký tự đặc biệt\n- Sử dụng password manager\n\n🛡️ **Xác thực 2 yếu tố (2FA)**:\n- Bật 2FA cho tất cả tài khoản quan trọng\n- Sử dụng app authenticator thay vì SMS\n\n🌐 **Duyệt web an toàn**:\n- Chỉ truy cập website HTTPS\n- Không click link lạ\n- Sử dụng VPN khi cần',
        role: 'assistant',
        createdAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'msg5',
        conversationId: 'conv3',
        userId: 'user3',
        content: 'Làm sao phân tích một website có độc hại không?',
        role: 'user',
        createdAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'msg6',
        conversationId: 'conv3',
        userId: 'user3',
        content: 'Để phân tích website độc hại:\n\n🔍 **Kiểm tra URL**:\n- Domain có chính tả đúng không\n- Có HTTPS không\n- Tuổi domain (domain mới thường đáng ngờ)\n\n🛡️ **Scan bảo mật**:\n- Sử dụng VirusTotal\n- Kiểm tra certificate SSL\n- Xem reputation score\n\n⚠️ **Dấu hiệu cảnh báo**:\n- Popup quá nhiều\n- Yêu cầu cài đặt phần mềm\n- Thiết kế kém chất lượng\n- Lỗi chính tả nhiều',
        role: 'assistant',
        createdAt: admin.firestore.Timestamp.now()
    }
];

async function migrateData() {
    try {
        console.log('👥 Migrating users...');
        for (const user of users) {
            await db.collection('users').doc(user.id).set(user);
            console.log(`✅ ${user.displayName}`);
        }

        console.log('\n🔗 Migrating community posts...');
        for (const post of posts) {
            await db.collection('links').doc(post.id).set(post);
            console.log(`✅ ${post.title.substring(0, 50)}...`);
        }

        console.log('\n🗳️ Migrating votes...');
        for (const vote of votes) {
            await db.collection('votes').doc(vote.id).set(vote);
            console.log(`✅ ${vote.id} (${vote.voteType})`);
        }

        console.log('\n💬 Migrating comments...');
        for (const comment of comments) {
            await db.collection('comments').doc(comment.id).set(comment);
            console.log(`✅ ${comment.id}`);
        }

        console.log('\n🗨️ Migrating conversations...');
        for (const conversation of conversations) {
            await db.collection('conversations').doc(conversation.id).set(conversation);
            console.log(`✅ ${conversation.title}`);
        }

        console.log('\n📝 Migrating chat messages...');
        for (const message of chatMessages) {
            await db.collection('chat_messages').doc(message.id).set(message);
            console.log(`✅ ${message.id}`);
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('=====================================');
        console.log(`👥 Users: ${users.length}`);
        console.log(`🔗 Community Posts: ${posts.length}`);
        console.log(`🗳️ Votes: ${votes.length}`);
        console.log(`💬 Comments: ${comments.length}`);
        console.log(`🗨️ Conversations: ${conversations.length}`);
        console.log(`📝 Chat Messages: ${chatMessages.length}`);
        
        const total = users.length + posts.length + votes.length + comments.length + conversations.length + chatMessages.length;
        console.log(`\n📊 Total documents migrated: ${total}`);
        
        console.log('\n✅ All in-memory and mock data has been migrated to Firestore!');
        console.log('🔥 Your FactCheck app now has real, persistent data.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateData();
