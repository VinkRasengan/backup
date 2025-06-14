import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext';
import { AuthProvider } from '../../../context/AuthContext';
import AppSidebar from '../AppSidebar';

const MockProviders = ({ children, user = null }) => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider value={{ user }}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

const mockUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  isAdmin: true
};

describe('AppSidebar', () => {
  const defaultProps = {
    isOpen: true,
    isCollapsed: false,
    onClose: jest.fn(),
    onToggleCollapse: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  describe('Responsive Behavior', () => {
    test('renders with correct responsive classes', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(sidebar).toHaveClass('fixed', 'top-0', 'left-0', 'h-full');
      expect(sidebar).toHaveClass('lg:w-72'); // Desktop width
      expect(sidebar).toHaveClass('w-72'); // Mobile width
    });

    test('shows mobile close button on mobile', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      const closeButton = screen.getByLabelText('Close navigation menu');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('lg:hidden');
    });

    test('shows desktop collapse button on desktop', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      const collapseButton = screen.getByLabelText('Collapse sidebar');
      expect(collapseButton).toBeInTheDocument();
      expect(collapseButton).toHaveClass('hidden', 'lg:block');
    });

    test('adjusts width when collapsed', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isCollapsed={true} />
        </MockProviders>
      );

      const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(sidebar).toHaveClass('lg:w-20'); // Collapsed width
    });
  });

  describe('Navigation Items', () => {
    test('displays main navigation items', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      expect(screen.getByText('Trang chủ')).toBeInTheDocument();
      expect(screen.getByText('Thịnh hành')).toBeInTheDocument();
      expect(screen.getByText('Cộng đồng')).toBeInTheDocument();
      expect(screen.getByText('Kiến thức')).toBeInTheDocument();
    });

    test('displays user navigation items', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      expect(screen.getByText('Kiểm tra')).toBeInTheDocument();
      expect(screen.getByText('Gửi bài viết')).toBeInTheDocument();
      expect(screen.getByText('Trợ lý AI')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    test('displays admin navigation for admin users', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Cài đặt')).toBeInTheDocument();
    });

    test('hides admin navigation for non-admin users', () => {
      const regularUser = { ...mockUser, isAdmin: false };
      
      render(
        <MockProviders user={regularUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.getByText('Cài đặt')).toBeInTheDocument(); // Settings still visible
    });

    test('hides auth-required items when user is not authenticated', () => {
      render(
        <MockProviders user={null}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      // Public items should be visible
      expect(screen.getByText('Trang chủ')).toBeInTheDocument();
      expect(screen.getByText('Kiểm tra')).toBeInTheDocument();

      // Auth-required items should be hidden
      expect(screen.queryByText('Gửi bài viết')).not.toBeInTheDocument();
      expect(screen.queryByText('Trợ lý AI')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Collapsed State', () => {
    test('hides section headers when collapsed', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isCollapsed={true} />
        </MockProviders>
      );

      expect(screen.queryByText('Khám phá')).not.toBeInTheDocument();
      expect(screen.queryByText('Công cụ')).not.toBeInTheDocument();
      expect(screen.queryByText('Quản lý')).not.toBeInTheDocument();
    });

    test('hides text labels when collapsed', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isCollapsed={true} />
        </MockProviders>
      );

      // Icons should still be present, but text should be hidden
      const homeLink = screen.getByLabelText('Trang chủ');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveClass('justify-center', 'px-2');
    });

    test('hides footer when collapsed', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isCollapsed={true} />
        </MockProviders>
      );

      expect(screen.queryByText('FactCheck v2.0')).not.toBeInTheDocument();
    });
  });

  describe('Active State Indication', () => {
    test('marks current page as active', () => {
      // Mock useLocation to return specific path
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({ pathname: '/community' })
      }));

      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      const communityLink = screen.getByText('Cộng đồng').closest('a');
      expect(communityLink).toHaveAttribute('aria-current', 'page');
      expect(communityLink).toHaveClass('bg-blue-50', 'dark:bg-blue-900/30');
    });
  });

  describe('Interaction Handlers', () => {
    test('calls onClose when mobile close button is clicked', () => {
      const mockOnClose = jest.fn();
      
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} onClose={mockOnClose} />
        </MockProviders>
      );

      const closeButton = screen.getByLabelText('Close navigation menu');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onToggleCollapse when desktop collapse button is clicked', () => {
      const mockOnToggleCollapse = jest.fn();
      
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} onToggleCollapse={mockOnToggleCollapse} />
        </MockProviders>
      );

      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);

      expect(mockOnToggleCollapse).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when navigation link is clicked', () => {
      const mockOnClose = jest.fn();
      
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} onClose={mockOnClose} />
        </MockProviders>
      );

      const homeLink = screen.getByText('Trang chủ');
      fireEvent.click(homeLink);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    test('closes sidebar when Escape key is pressed', () => {
      const mockOnClose = jest.fn();
      
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} onClose={mockOnClose} isOpen={true} />
        </MockProviders>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('does not close sidebar when Escape is pressed and sidebar is closed', () => {
      const mockOnClose = jest.fn();
      
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} onClose={mockOnClose} isOpen={false} />
        </MockProviders>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Management', () => {
    test('prevents body scroll when sidebar is open on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isOpen={true} />
        </MockProviders>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    test('restores body scroll when sidebar is closed', () => {
      const { rerender } = render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isOpen={true} />
        </MockProviders>
      );

      rerender(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isOpen={false} />
        </MockProviders>
      );

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Animation States', () => {
    test('sidebar has correct animation classes when open', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isOpen={true} />
        </MockProviders>
      );

      const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(sidebar).toBeInTheDocument();
    });

    test('overlay appears when sidebar is open on mobile', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isOpen={true} />
        </MockProviders>
      );

      // Check for overlay (it should be in the DOM but might not be visible in tests)
      const overlays = document.querySelectorAll('.fixed.inset-0.bg-black\\/50');
      expect(overlays.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('sidebar has proper navigation landmarks', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'User tools' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Admin tools' })).toBeInTheDocument();
    });

    test('navigation links have proper ARIA labels', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} />
        </MockProviders>
      );

      const homeLink = screen.getByLabelText('Trang chủ');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('aria-label', 'Trang chủ');
    });

    test('collapse button has proper ARIA label', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isCollapsed={false} />
        </MockProviders>
      );

      const collapseButton = screen.getByLabelText('Collapse sidebar');
      expect(collapseButton).toBeInTheDocument();
    });

    test('expand button has proper ARIA label when collapsed', () => {
      render(
        <MockProviders user={mockUser}>
          <AppSidebar {...defaultProps} isCollapsed={true} />
        </MockProviders>
      );

      const expandButton = screen.getByLabelText('Expand sidebar');
      expect(expandButton).toBeInTheDocument();
    });
  });
});
