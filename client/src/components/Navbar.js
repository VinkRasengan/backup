import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, Home, Search, BarChart3 } from 'lucide-react';
import styled from 'styled-components';

const NavbarContainer = styled.nav`
  background: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 50;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;

  &:hover {
    color: #3b82f6;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  min-width: 12rem;
  z-index: 50;
`;

const DropdownItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem;

  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
  }
`;

const MobileNavLink = styled(Link)`
  display: block;
  padding: 0.75rem 0;
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid #f3f4f6;

  &:hover {
    color: #3b82f6;
  }
`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <NavbarContainer>
      <NavContent>
        <Logo to="/">
          <BarChart3 size={24} />
          FactCheck
        </Logo>

        {user && (
          <NavLinks>
            <NavLink to="/dashboard">
              <Home size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/check-link">
              <Search size={18} />
              Check Link
            </NavLink>
          </NavLinks>
        )}

        {user ? (
          <UserMenu>
            <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
              <User size={20} />
              {user.firstName}
            </UserButton>
            {showUserMenu && (
              <DropdownMenu>
                <DropdownItem onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                  <User size={16} />
                  Profile
                </DropdownItem>
                <DropdownItem onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </DropdownItem>
              </DropdownMenu>
            )}
          </UserMenu>
        ) : (
          <NavLinks>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register" className="btn btn-primary">Register</NavLink>
          </NavLinks>
        )}

        <MobileMenuButton onClick={() => setShowMobileMenu(!showMobileMenu)}>
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </MobileMenuButton>
      </NavContent>

      <MobileMenu isOpen={showMobileMenu}>
        {user ? (
          <>
            <MobileNavLink to="/dashboard" onClick={() => setShowMobileMenu(false)}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink to="/check-link" onClick={() => setShowMobileMenu(false)}>
              Check Link
            </MobileNavLink>
            <MobileNavLink to="/profile" onClick={() => setShowMobileMenu(false)}>
              Profile
            </MobileNavLink>
            <button 
              onClick={handleLogout}
              style={{ 
                width: '100%', 
                textAlign: 'left', 
                padding: '0.75rem 0', 
                border: 'none', 
                background: 'none',
                color: '#6b7280',
                fontWeight: '500'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <MobileNavLink to="/login" onClick={() => setShowMobileMenu(false)}>
              Login
            </MobileNavLink>
            <MobileNavLink to="/register" onClick={() => setShowMobileMenu(false)}>
              Register
            </MobileNavLink>
          </>
        )}
      </MobileMenu>
    </NavbarContainer>
  );
};

export default Navbar;
