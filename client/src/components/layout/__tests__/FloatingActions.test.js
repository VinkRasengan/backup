import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext';
import { AuthProvider } from '../../../context/AuthContext';
import FloatingActions from '../FloatingActions';

// Mock ChatWidget component
jest.mock('../../ChatBot/ChatWidget', () => {
  return function MockChatWidget({ onClose, isFloating }) {
    return (
      <div data-testid="chat-widget">
        <button onClick={onClose}>Close Chat</button>
        <span>Floating: {isFloating ? 'true' : 'false'}</span>
      </div>
    );
  };
});

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
  email: 'john@example.com'
};

describe('FloatingActions', () => {
  beforeEach(() => {
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility Rules', () => {
    test('does not render when user is not authenticated', () => {
      render(
        <MockProviders user={null}>
          <FloatingActions />
        </MockProviders>
      );

      expect(screen.queryByLabelText(/Open add menu/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Open chat assistant/)).not.toBeInTheDocument();
    });

    test('renders when user is authenticated', () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      expect(screen.getByLabelText('Open add menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Open chat assistant')).toBeInTheDocument();
    });

    test('does not render on login/register pages', () => {
      // Mock useLocation to return login page
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({ pathname: '/login' })
      }));

      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      expect(screen.queryByLabelText(/Open add menu/)).not.toBeInTheDocument();
    });
  });

  describe('Fixed Positioning', () => {
    test('floating actions have fixed positioning with correct margin', () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const container = screen.getByLabelText('Open add menu').closest('.fixed');
      expect(container).toHaveClass('fixed', 'bottom-6', 'right-6', 'z-50');
      expect(container).toHaveStyle('margin: 24px');
    });

    test('chat widget has fixed positioning when open', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const chatButton = screen.getByLabelText('Open chat assistant');
      fireEvent.click(chatButton);

      await waitFor(() => {
        const chatContainer = screen.getByTestId('chat-widget').closest('.fixed');
        expect(chatContainer).toHaveClass('fixed', 'bottom-24', 'right-6', 'z-40');
        expect(chatContainer).toHaveStyle('margin: 24px');
      });
    });
  });

  describe('Scroll to Top Functionality', () => {
    test('scroll to top button appears when scrolled down', () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      // Initially hidden
      expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument();

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { value: 500 });
      fireEvent.scroll(window);

      expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
    });

    test('scroll to top button calls window.scrollTo when clicked', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 });
      
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      fireEvent.scroll(window);
      
      const scrollButton = screen.getByLabelText('Scroll to top');
      fireEvent.click(scrollButton);

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Add Menu Functionality', () => {
    test('add menu opens and closes correctly', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const addButton = screen.getByLabelText('Open add menu');
      
      // Open menu
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Submit Article')).toBeInTheDocument();
        expect(screen.getByText('Check Link')).toBeInTheDocument();
        expect(addButton).toHaveAttribute('aria-expanded', 'true');
        expect(addButton).toHaveAttribute('aria-label', 'Close add menu');
      });

      // Close menu
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Submit Article')).not.toBeInTheDocument();
        expect(addButton).toHaveAttribute('aria-expanded', 'false');
        expect(addButton).toHaveAttribute('aria-label', 'Open add menu');
      });
    });

    test('add menu items have correct links and labels', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const addButton = screen.getByLabelText('Open add menu');
      fireEvent.click(addButton);

      await waitFor(() => {
        const submitLink = screen.getByLabelText('Submit new article');
        const checkLink = screen.getByLabelText('Check link credibility');
        
        expect(submitLink).toHaveAttribute('href', '/submit');
        expect(submitLink).toHaveAttribute('title', 'Submit new article');
        
        expect(checkLink).toHaveAttribute('href', '/check');
        expect(checkLink).toHaveAttribute('title', 'Check link credibility');
      });
    });
  });

  describe('Chat Widget Functionality', () => {
    test('chat widget opens and closes correctly', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const chatButton = screen.getByLabelText('Open chat assistant');
      
      // Open chat
      fireEvent.click(chatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
        expect(chatButton).toHaveAttribute('aria-expanded', 'true');
        expect(chatButton).toHaveAttribute('aria-label', 'Close chat');
      });

      // Close chat via button
      const closeButton = screen.getByText('Close Chat');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();
        expect(chatButton).toHaveAttribute('aria-expanded', 'false');
        expect(chatButton).toHaveAttribute('aria-label', 'Open chat assistant');
      });
    });

    test('chat widget receives correct props', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const chatButton = screen.getByLabelText('Open chat assistant');
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByText('Floating: true')).toBeInTheDocument();
      });
    });

    test('chat button has notification indicator', () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const notificationDot = screen.getByText('New messages available');
      expect(notificationDot).toBeInTheDocument();
      expect(notificationDot.parentElement).toHaveClass('animate-pulse');
    });
  });

  describe('Widget Interactions', () => {
    test('opening one widget closes the other', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const addButton = screen.getByLabelText('Open add menu');
      const chatButton = screen.getByLabelText('Open chat assistant');

      // Open add menu
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByText('Submit Article')).toBeInTheDocument();
      });

      // Open chat (should close add menu)
      fireEvent.click(chatButton);
      await waitFor(() => {
        expect(screen.queryByText('Submit Article')).not.toBeInTheDocument();
        expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
      });
    });

    test('widgets close when route changes', () => {
      const { rerender } = render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      // Open widgets
      const addButton = screen.getByLabelText('Open add menu');
      const chatButton = screen.getByLabelText('Open chat assistant');
      
      fireEvent.click(addButton);
      fireEvent.click(chatButton);

      // Simulate route change by re-rendering with different location
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({ pathname: '/different-page' })
      }));

      rerender(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      // Widgets should be closed
      expect(addButton).toHaveAttribute('aria-expanded', 'false');
      expect(chatButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Mobile Backdrop', () => {
    test('mobile backdrop appears when widgets are open', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const chatButton = screen.getByLabelText('Open chat assistant');
      fireEvent.click(chatButton);

      await waitFor(() => {
        const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/20.z-30.lg\\:hidden');
        expect(backdrop).toBeInTheDocument();
      });
    });

    test('clicking backdrop closes widgets', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const chatButton = screen.getByLabelText('Open chat assistant');
      fireEvent.click(chatButton);

      await waitFor(() => {
        const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/20.z-30.lg\\:hidden');
        fireEvent.click(backdrop);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();
        expect(chatButton).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Accessibility', () => {
    test('all buttons have proper ARIA labels and titles', () => {
      Object.defineProperty(window, 'scrollY', { value: 500 });
      
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      fireEvent.scroll(window);

      // Check all buttons have aria-label
      expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
      expect(screen.getByLabelText('Open add menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Open chat assistant')).toBeInTheDocument();

      // Check titles
      expect(screen.getByTitle('Scroll to top')).toBeInTheDocument();
      expect(screen.getByTitle('Add new content')).toBeInTheDocument();
      expect(screen.getByTitle('Chat with AI assistant')).toBeInTheDocument();
    });

    test('buttons have proper aria-expanded states', async () => {
      render(
        <MockProviders user={mockUser}>
          <FloatingActions />
        </MockProviders>
      );

      const addButton = screen.getByLabelText('Open add menu');
      const chatButton = screen.getByLabelText('Open chat assistant');

      // Initially collapsed
      expect(addButton).toHaveAttribute('aria-expanded', 'false');
      expect(chatButton).toHaveAttribute('aria-expanded', 'false');

      // After opening
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(addButton).toHaveAttribute('aria-expanded', 'true');
      });

      fireEvent.click(chatButton);
      await waitFor(() => {
        expect(chatButton).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});
