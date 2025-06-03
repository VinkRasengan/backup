import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Edit3, Save, X } from 'lucide-react';
import styled from 'styled-components';

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ProfileTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 0.5rem;
`;

const ProfileSubtitle = styled.p`
  color: #6b7280;
`;

const ProfileCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ProfileInfo = styled.div`
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
`;

const Avatar = styled.div`
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
`;

const UserName = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
`;

const UserEmail = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
`;

const UserStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: #1a202c;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ProfileDetails = styled.div`
  padding: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const CancelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;

  &:hover {
    background: #4b5563;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
`;

const DetailIcon = styled.div`
  color: #6b7280;
`;

const DetailContent = styled.div`
  flex: 1;
`;

const DetailLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.div`
  font-weight: 500;
  color: #1a202c;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid ${props => props.error ? '#ef4444' : '#d1d5db'};
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid ${props => props.error ? '#ef4444' : '#d1d5db'};
  border-radius: 0.375rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
`;

const FormActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const schema = yup.object({
  firstName: yup
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .required('Last name is required'),
  bio: yup
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
});

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.profile?.bio || ''
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        setIsEditing(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.profile?.bio || ''
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  if (!user) {
    return (
      <ProfileContainer>
        <div className="card">
          <p>Loading profile...</p>
        </div>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <ProfileHeader>
        <ProfileTitle>Profile Settings</ProfileTitle>
        <ProfileSubtitle>Manage your account information and preferences</ProfileSubtitle>
      </ProfileHeader>

      <ProfileCard>
        <ProfileInfo>
          <Avatar>
            {getInitials()}
          </Avatar>
          <UserName>{user.firstName} {user.lastName}</UserName>
          <UserEmail>{user.email}</UserEmail>
          <UserStats>
            <StatItem>
              <StatValue>{user.stats?.linksChecked || 0}</StatValue>
              <StatLabel>Links Checked</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>
                {user.stats?.joinedAt ? 
                  new Date(user.stats.joinedAt).toLocaleDateString() : 
                  'Unknown'
                }
              </StatValue>
              <StatLabel>Member Since</StatLabel>
            </StatItem>
          </UserStats>
        </ProfileInfo>

        <ProfileDetails>
          <SectionHeader>
            <SectionTitle>Personal Information</SectionTitle>
            {!isEditing && (
              <EditButton onClick={() => setIsEditing(true)}>
                <Edit3 size={16} />
                Edit Profile
              </EditButton>
            )}
          </SectionHeader>

          {isEditing ? (
            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  error={errors.firstName}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <ErrorMessage>{errors.firstName.message}</ErrorMessage>
                )}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  error={errors.lastName}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <ErrorMessage>{errors.lastName.message}</ErrorMessage>
                )}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="bio">Bio</Label>
                <TextArea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  error={errors.bio}
                  {...register('bio')}
                />
                {errors.bio && (
                  <ErrorMessage>{errors.bio.message}</ErrorMessage>
                )}
              </FormGroup>

              <FormActions>
                <CancelButton type="button" onClick={handleCancel}>
                  <X size={16} />
                  Cancel
                </CancelButton>
                <EditButton type="submit" disabled={isLoading}>
                  <Save size={16} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </EditButton>
              </FormActions>
            </Form>
          ) : (
            <>
              <DetailItem>
                <DetailIcon>
                  <User size={20} />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Full Name</DetailLabel>
                  <DetailValue>{user.firstName} {user.lastName}</DetailValue>
                </DetailContent>
              </DetailItem>

              <DetailItem>
                <DetailIcon>
                  <Mail size={20} />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Email Address</DetailLabel>
                  <DetailValue>{user.email}</DetailValue>
                </DetailContent>
              </DetailItem>

              <DetailItem>
                <DetailIcon>
                  <Calendar size={20} />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Member Since</DetailLabel>
                  <DetailValue>
                    {user.createdAt ? 
                      new Date(user.createdAt).toLocaleDateString() : 
                      'Unknown'
                    }
                  </DetailValue>
                </DetailContent>
              </DetailItem>

              {user.profile?.bio && (
                <DetailItem>
                  <DetailIcon>
                    <Edit3 size={20} />
                  </DetailIcon>
                  <DetailContent>
                    <DetailLabel>Bio</DetailLabel>
                    <DetailValue>{user.profile.bio}</DetailValue>
                  </DetailContent>
                </DetailItem>
              )}
            </>
          )}
        </ProfileDetails>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default ProfilePage;
