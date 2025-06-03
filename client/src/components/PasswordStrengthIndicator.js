import React from 'react';
import { CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  const requirements = [
    {
      id: 'length',
      label: 'Ít nhất 8 ký tự',
      test: (pwd) => pwd.length >= 8
    },
    {
      id: 'uppercase',
      label: 'Có chữ hoa (A-Z)',
      test: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      id: 'lowercase',
      label: 'Có chữ thường (a-z)',
      test: (pwd) => /[a-z]/.test(pwd)
    },
    {
      id: 'number',
      label: 'Có số (0-9)',
      test: (pwd) => /[0-9]/.test(pwd)
    },
    {
      id: 'special',
      label: 'Có ký tự đặc biệt (!@#$%^&*)',
      test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    }
  ];

  const getStrengthScore = () => {
    return requirements.filter(req => req.test(password)).length;
  };

  const getStrengthLevel = () => {
    const score = getStrengthScore();
    if (score < 2) return { level: 'Rất yếu', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (score < 3) return { level: 'Yếu', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (score < 4) return { level: 'Trung bình', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score < 5) return { level: 'Mạnh', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { level: 'Rất mạnh', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const strengthLevel = getStrengthLevel();
  const score = getStrengthScore();

  if (!showRequirements && !password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Indicator */}
      {password && (
        <motion.div
          className="flex items-center space-x-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full ${
                score < 2 ? 'bg-red-500' :
                score < 3 ? 'bg-orange-500' :
                score < 4 ? 'bg-yellow-500' :
                score < 5 ? 'bg-blue-500' : 'bg-green-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${(score / 5) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <motion.span
            className={`text-sm font-medium ${strengthLevel.color} min-w-[80px]`}
            key={strengthLevel.level}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {strengthLevel.level}
          </motion.span>
        </motion.div>
      )}

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Yêu cầu mật khẩu:
          </p>
          {requirements.map((req, index) => {
            const isValid = req.test(password);
            return (
              <motion.div
                key={req.id}
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.1 + 0.2 }}
                >
                  {isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </motion.div>
                <span className={`text-sm transition-colors duration-200 ${
                  isValid ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {req.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Security Tips */}
      {password && score < 5 && (
        <div className={`p-3 rounded-lg ${strengthLevel.bgColor} mt-3`}>
          <p className={`text-sm ${strengthLevel.color} font-medium`}>
            💡 Mẹo tạo mật khẩu mạnh:
          </p>
          <ul className={`text-sm ${strengthLevel.color} mt-1 space-y-1`}>
            {score < 3 && (
              <li>• Sử dụng cụm từ dễ nhớ kết hợp với số và ký tự đặc biệt</li>
            )}
            {!requirements[1].test(password) && (
              <li>• Thêm chữ hoa để tăng độ bảo mật</li>
            )}
            {!requirements[4].test(password) && (
              <li>• Thêm ký tự đặc biệt như !@#$%^&*</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
