import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MessageCircle, 
  FileText, 
  Shield,
  Users,
  Zap,
  Camera,
  Link as LinkIcon
} from 'lucide-react';
import { gsap } from '../../utils/gsap';
import { useGSAP } from '../../hooks/useGSAP';

const QuickActionWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Quick actions data
  const quickActions = [
    {
      id: 'check-link',
      label: 'Kiểm tra Link',
      icon: Search,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Kiểm tra tính an toàn của link'
    },
    {
      id: 'scan-file',
      label: 'Quét File',
      icon: Shield,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Quét virus và malware'
    },
    {
      id: 'create-post',
      label: 'Tạo bài viết',
      icon: FileText,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Chia sẻ với cộng đồng'
    },
    {
      id: 'start-chat',
      label: 'Chat AI',
      icon: MessageCircle,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Hỏi trợ lý AI'
    },
    {
      id: 'join-discussion',
      label: 'Thảo luận',
      icon: Users,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Tham gia thảo luận'
    },
    {
      id: 'quick-scan',
      label: 'Quét nhanh',
      icon: Zap,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Quét nhanh URL'
    },
    {
      id: 'screenshot',
      label: 'Chụp màn hình',
      icon: Camera,
      color: 'bg-pink-500 hover:bg-pink-600',
      description: 'Chụp và phân tích'
    },
    {
      id: 'share-link',
      label: 'Chia sẻ Link',
      icon: LinkIcon,
      color: 'bg-teal-500 hover:bg-teal-600',
      description: 'Chia sẻ link an toàn'
    }
  ];

  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Floating animation for the main button
    gsap.to(buttonRef.current, {
      y: -5,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

  }, []);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    
    // GSAP animation for button rotation
    gsap.to(buttonRef.current, {
      rotation: isOpen ? 0 : 45,
      duration: 0.3,
      ease: "back.out(1.7)"
    });
  };

  const handleActionClick = (action) => {
    // Add click animation
    gsap.to(`.action-${action.id}`, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    });

    // Handle action logic
    switch (action.id) {
      case 'check-link':
        window.location.href = '/check';
        break;
      case 'scan-file':
        // Implement file scanning
        alert('Tính năng quét file đang được phát triển');
        break;
      case 'create-post':
        window.location.href = '/submit';
        break;
      case 'start-chat':
        window.location.href = '/chat';
        break;
      case 'join-discussion':
        window.location.href = '/community';
        break;
      case 'quick-scan': {
        // Quick URL scan with Gemini
        const url = prompt('Nhập URL cần kiểm tra:');
        if (url) {
          handleQuickScan(url);
        }
        break;
      }
      case 'screenshot':
        // Implement screenshot analysis
        alert('Tính năng chụp màn hình đang được phát triển');
        break;
      case 'share-link':
        // Implement link sharing
        navigator.share ?
          navigator.share({
            title: 'FactCheck AI',
            text: 'Kiểm tra thông tin với FactCheck AI',
            url: window.location.origin
          }) :
          alert('Tính năng chia sẻ không được hỗ trợ trên trình duyệt này');
        break;
      default:
        console.log(`Executing action: ${action.id}`);
    }

    // Close widget after action
    setTimeout(() => {
      setIsOpen(false);
      gsap.to(buttonRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }, 200);
  };

  const handleQuickScan = async (url) => {
    try {
      // Show loading state
      alert('Đang phân tích URL với Gemini AI...');

      const response = await fetch('/api/gemini/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Kết quả phân tích:\n\nĐộ tin cậy: ${data.credibilityScore}/100\nMức rủi ro: ${data.riskLevel}\n\n${data.analysis}`);
      } else {
        alert('Không thể phân tích URL. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Quick scan error:', error);
      alert('Lỗi kết nối. Vui lòng thử lại sau.');
    }
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 grid grid-cols-2 gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80"
          >
            <div className="col-span-2 text-center mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Hành động nhanh
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chọn một hành động để thực hiện
              </p>
            </div>
            
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                onClick={() => handleActionClick(action)}
                className={`action-${action.id} p-3 rounded-xl text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${action.color}`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <action.icon className="w-5 h-5" />
                  <div className="text-center">
                    <div className="text-xs font-medium">{action.label}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        ref={buttonRef}
        onClick={toggleWidget}
        className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          delay: 0.5
        }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 -z-10"
            onClick={() => {
              setIsOpen(false);
              gsap.to(buttonRef.current, {
                rotation: 0,
                duration: 0.3,
                ease: "back.out(1.7)"
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickActionWidget;
