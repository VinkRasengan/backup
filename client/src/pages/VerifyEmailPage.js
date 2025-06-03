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
          setMessage('Email đã được xác minh thành công! Bạn có thể đăng nhập ngay bây giờ.');
          // Auto redirect to login after 3 seconds
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Xác minh email thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.');
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
            <Title>Đang Xác Minh Email</Title>
            <LoadingSpinner text="Vui lòng đợi trong khi chúng tôi xác minh email của bạn..." />
          </>
        );

      case 'success':
        return (
          <>
            <IconContainer success>
              <CheckCircle size={32} />
            </IconContainer>
            <Title>Email Đã Được Xác Minh!</Title>
            <Message>{message}</Message>
            <Message style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Bạn sẽ được chuyển hướng đến trang đăng nhập trong 3 giây...
            </Message>
            <ActionButton to="/login">
              Đăng Nhập Ngay
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
            <Title>Xác Minh Thất Bại</Title>
            <Message>{message}</Message>
            <ActionButton to="/register">
              Quay Lại Đăng Ký
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
