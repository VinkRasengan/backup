import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext';
import { AuthProvider } from '../../../context/AuthContext';
import AppHeader from '../AppHeader';

// Mock the context providers
const MockProviders = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Mock user data
const mockUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  isAdmin: false
};

describe('AppHeader', () => {
  const defaultProps = {
    onMenuClick: jest.fn(),
    showMenuButton: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Responsive Design', () => {
    test('displays logo and search bar on all breakpoints', () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} />
        </MockProviders>
      );

      // Logo should be visible
      expect(screen.getByLabelText('FactCheck homepage')).toBeInTheDocument();
      
      // Search bar should be visible
      expect(screen.getByPlaceholderText('Tìm kiếm bài viết, chủ đề...')).toBeInTheDocument();
    });

    test('shows mobile menu button when showMenuButton is true', () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} showMenuButton={true} />
        </MockProviders>
      );

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveClass('lg:hidden'); // Hidden on desktop
    });

    test('hides mobile menu button when showMenuButton is false', () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} showMenuButton={false} />
        </MockProviders>
      );

      expect(screen.queryByLabelText('Toggle navigation menu')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('displays search suggestions when input is focused', async () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} />
        </MockProviders>
      );

      const searchInput = screen.getByPlaceholderText('Tìm kiếm bài viết, chủ đề...');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    test('search input has proper ARIA labels', () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} />
        </MockProviders>
      );

      const searchInput = screen.getByLabelText('Search articles and topics');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-suggestions');
    });
  });

  describe('User Authentication States', () => {
    test('shows login/register buttons when user is not authenticated', () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} />
        </MockProviders>
      );

      expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
      expect(screen.getByText('Đăng ký')).toBeInTheDocument();
    });

    test('shows user menu and action icons when user is authenticated', () => {
      // Mock authenticated user
      const AuthProviderWithUser = ({ children }) => (
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider value={{ user: mockUser, logout: jest.fn() }}>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      render(
        <AuthProviderWithUser>
          <AppHeader {...defaultProps} />
        </AuthProviderWithUser>
      );

      // Should show action icons
      expect(screen.getByLabelText('Submit new article')).toBeInTheDocument();
      expect(screen.getByLabelText('Open chat assistant')).toBeInTheDocument();
      expect(screen.getByLabelText(/Notifications/)).toBeInTheDocument();
      
      // Should show user menu
      expect(screen.getByLabelText('User menu')).toBeInTheDocument();
    });
  });

  describe('Icon Tooltips and ARIA Labels', () => {
    test('all icon buttons have proper ARIA labels', () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} showMenuButton={true} />
        </MockProviders>
      );

      // Menu button
      expect(screen.getByLabelText('Toggle navigation menu')).toBeInTheDocument();
      
      // Logo
      expect(screen.getByLabelText('FactCheck homepage')).toBeInTheDocument();
    });

    test('action icons have tooltips via title attribute', () => {
      const AuthProviderWithUser = ({ children }) => (
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider value={{ user: mockUser, logout: jest.fn() }}>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      render(
        <AuthProviderWithUser>
          <AppHeader {...defaultProps} />
        </AuthProviderWithUser>
      );

      expect(screen.getByTitle('Submit new article')).toBeInTheDocument();
      expect(screen.getByTitle('Chat Assistant')).toBeInTheDocument();
      expect(screen.getByTitle('Notifications')).toBeInTheDocument();
    });
  });

  describe('Dropdown Interactions', () => {
    test('notifications dropdown opens and closes correctly', async () => {
      const AuthProviderWithUser = ({ children }) => (
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider value={{ user: mockUser, logout: jest.fn() }}>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      render(
        <AuthProviderWithUser>
          <AppHeader {...defaultProps} />
        </AuthProviderWithUser>
      );

      const notificationButton = screen.getByLabelText(/Notifications/);
      
      // Open dropdown
      fireEvent.click(notificationButton);
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: 'Notifications menu' })).toBeInTheDocument();
      });

      // Check aria-expanded
      expect(notificationButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('user menu dropdown has proper menu items', async () => {
      const AuthProviderWithUser = ({ children }) => (
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider value={{ user: mockUser, logout: jest.fn() }}>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      render(
        <AuthProviderWithUser>
          <AppHeader {...defaultProps} />
        </AuthProviderWithUser>
      );

      const userMenuButton = screen.getByLabelText('User menu');
      fireEvent.click(userMenuButton);

      await waitFor(() => {
        expect(screen.getByRole('menu', { name: 'User menu' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Dashboard/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Cài đặt/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Đăng xuất/ })).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Menu Integration', () => {
    test('calls onMenuClick when mobile menu button is clicked', () => {
      const mockOnMenuClick = jest.fn();
      
      render(
        <MockProviders>
          <AppHeader onMenuClick={mockOnMenuClick} showMenuButton={true} />
        </MockProviders>
      );

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('header has proper landmark role', () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} />
        </MockProviders>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    test('search suggestions have proper ARIA attributes', async () => {
      render(
        <MockProviders>
          <AppHeader {...defaultProps} />
        </MockProviders>
      );

      const searchInput = screen.getByPlaceholderText('Tìm kiếm bài viết, chủ đề...');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveAttribute('id', 'search-suggestions');
        
        const options = screen.getAllByRole('option');
        options.forEach(option => {
          expect(option).toHaveAttribute('aria-selected', 'false');
        });
      });
    });

    test('dropdown menus have proper focus management', async () => {
      const AuthProviderWithUser = ({ children }) => (
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider value={{ user: mockUser, logout: jest.fn() }}>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      render(
        <AuthProviderWithUser>
          <AppHeader {...defaultProps} />
        </AuthProviderWithUser>
      );

      const userMenuButton = screen.getByLabelText('User menu');
      fireEvent.click(userMenuButton);

      await waitFor(() => {
        const menu = screen.getByRole('menu', { name: 'User menu' });
        expect(menu).toBeInTheDocument();
        
        // Menu items should be focusable
        const menuItems = screen.getAllByRole('menuitem');
        menuItems.forEach(item => {
          expect(item).not.toHaveAttribute('tabindex', '-1');
        });
      });
    });
  });
});
