import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, X, RefreshCw } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const BannerContainer = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const IconContainer = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TextContainer = styled.div`
  flex: 1;
`;

const Title = styled.h3`
  color: #92400e;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`;

const Message = styled.p`
  color: #b45309;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ResendButton = styled.button`
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #d97706;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: ${spin} 1s linear infinite;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #92400e;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(146, 64, 14, 0.1);
  }
`;

const EmailVerificationBanner = ({ onDismiss }) => {
  const { user, resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Don't show banner if user is verified or not logged in
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <BannerContainer>
      <BannerContent>
        <IconContainer>
          <Mail size={20} />
        </IconContainer>
        <TextContainer>
          <Title>Email Verification Required</Title>
          <Message>
            Please verify your email address to access all features. Check your inbox for a verification link.
          </Message>
        </TextContainer>
      </BannerContent>
      
      <ActionsContainer>
        <ResendButton 
          onClick={handleResendEmail} 
          disabled={isResending}
        >
          {isResending ? (
            <>
              <RefreshCw size={16} className="spinning" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Resend
            </>
          )}
        </ResendButton>
        
        {onDismiss && (
          <CloseButton onClick={onDismiss}>
            <X size={20} />
          </CloseButton>
        )}
      </ActionsContainer>
    </BannerContainer>
  );
};

export default EmailVerificationBanner;
