import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';
import styled from 'styled-components';
import LoadingSpinner from '../components/LoadingSpinner';

const VerifyContainer = styled.div`
  min-height: calc(100vh - 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: #f8fafc;
`;

const VerifyCard = styled.div`
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
  background: ${props => props.success ? '#dcfce7' : props.error ? '#fecaca' : '#e0e7ff'};
  color: ${props => props.success ? '#16a34a' : props.error ? '#dc2626' : '#3b82f6'};
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

const ActionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Firebase Auth uses different parameter names for email verification
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');

    if (mode !== 'verifyEmail' || !actionCode) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyEmail(actionCode);
        if (result.success) {
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now access all features.');
        } else {
          setStatus('error');
          setMessage(result.error || 'Email verification failed. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again later.');
      }
    };

    verify();
  }, [searchParams, verifyEmail]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <IconContainer>
              <Mail size={32} />
            </IconContainer>
            <Title>Verifying Email</Title>
            <LoadingSpinner text="Please wait while we verify your email..." />
          </>
        );

      case 'success':
        return (
          <>
            <IconContainer success>
              <CheckCircle size={32} />
            </IconContainer>
            <Title>Email Verified!</Title>
            <Message>{message}</Message>
            <ActionButton to="/login">
              Continue to Login
              <ArrowRight size={16} />
            </ActionButton>
          </>
        );

      case 'error':
        return (
          <>
            <IconContainer error>
              <XCircle size={32} />
            </IconContainer>
            <Title>Verification Failed</Title>
            <Message>{message}</Message>
            <ActionButton to="/register">
              Back to Registration
              <ArrowRight size={16} />
            </ActionButton>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <VerifyContainer>
      <VerifyCard>
        {renderContent()}
      </VerifyCard>
    </VerifyContainer>
  );
};

export default VerifyEmailPage;
