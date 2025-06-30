import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';

const EmailVerificationRequiredPage = () => {
  const { user, resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-yellow-100 text-yellow-600">
          <Mail size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Email Verification Required
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          To access this feature, you need to verify your email address. 
          We've sent a verification link to <strong>{user?.email}</strong>.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
            <CheckCircle size={16} />
            What to do next:
          </h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            1. Check your email inbox (and spam folder)<br/>
            2. Click the verification link in the email<br/>
            3. Return to this page and refresh
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isResending ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Resend Verification Email
              </>
            )}
          </button>
          
          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors no-underline"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        <p className="text-gray-600 text-sm">
          Having trouble? Contact support for assistance.
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationRequiredPage;
