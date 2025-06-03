import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: calc(100vh - 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: #f8fafc;
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
`;

const IconContainer = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  background: #fef3c7;
  color: #f59e0b;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const InfoBox = styled.div`
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: left;
`;

const InfoTitle = styled.h3`
  color: #0c4a6e;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoText = styled.p`
  color: #075985;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
`;

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
    <Container>
      <Card>
        <IconContainer>
          <Mail size={32} />
        </IconContainer>
        
        <Title>Email Verification Required</Title>
        
        <Message>
          To access this feature, you need to verify your email address. 
          We've sent a verification link to <strong>{user?.email}</strong>.
        </Message>

        <InfoBox>
          <InfoTitle>
            <CheckCircle size={16} />
            What to do next:
          </InfoTitle>
          <InfoText>
            1. Check your email inbox (and spam folder)<br/>
            2. Click the verification link in the email<br/>
            3. Return to this page and refresh
          </InfoText>
        </InfoBox>

        <ButtonGroup>
          <PrimaryButton 
            onClick={handleResendEmail} 
            disabled={isResending}
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
          </PrimaryButton>
          
          <SecondaryButton to="/dashboard">
            <ArrowLeft size={16} />
            Back to Dashboard
          </SecondaryButton>
        </ButtonGroup>

        <Message style={{ fontSize: '0.875rem', marginBottom: 0 }}>
          Having trouble? Contact support for assistance.
        </Message>
      </Card>
    </Container>
  );
};

export default EmailVerificationRequiredPage;
