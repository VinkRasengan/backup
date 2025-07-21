// Route validation utility
export const validateRoutes = () => {
  const appRoutes = [
    '/',
    '/login',
    '/register',
    '/registration-success',
    '/email-verification-required',
    '/forgot-password',
    '/reset-password',
    '/dashboard',
    '/check',
    '/profile',
    '/chat',
    '/admin',
    '/admin/dashboard',
    '/admin/firestore-test',
    '/community',
    '/community/feed',
    '/submit',
    '/my-submissions',
    '/knowledge',
    '/knowledge/:id',
    '/settings',
    '/security',
    '/analytics',
    '/premium',
    '/notifications',
    '/favorites',
    '/achievements',
    '/help',
    '/settings/account',
    '/settings/security',
    '/settings/notifications',
    '/settings/appearance'
  ];

  const sidebarRoutes = [
    '/',
    '/check',
    '/community',
    '/submit',
    '/my-submissions',
    '/chat',
    '/knowledge',
    '/security',
    '/analytics',
    '/premium',
    '/dashboard',
    '/profile',
    '/notifications',
    '/favorites',
    '/achievements',
    '/settings',
    '/settings/account',
    '/settings/security',
    '/settings/notifications',
    '/settings/appearance',
    '/admin/firestore-test',
    '/help'
  ];

  const mobileTabRoutes = [
    '/',
    '/check',
    '/community',
    '/chat',
    '/dashboard'
  ];

  // Check for routes in sidebar but not in app
  const sidebarOnlyRoutes = sidebarRoutes.filter(route => 
    !appRoutes.includes(route) && !route.includes(':')
  );

  // Check for routes in mobile tab but not in app
  const mobileOnlyRoutes = mobileTabRoutes.filter(route => 
    !appRoutes.includes(route)
  );

  return {
    appRoutes,
    sidebarRoutes,
    mobileTabRoutes,
    sidebarOnlyRoutes,
    mobileOnlyRoutes,
    isValid: sidebarOnlyRoutes.length === 0 && mobileOnlyRoutes.length === 0
  };
};

// Route protection levels
export const getRouteProtection = (path) => {
  const publicRoutes = ['/', '/login', '/register', '/registration-success', '/community', '/knowledge', '/help'];
  const protectedRoutes = ['/dashboard', '/profile', '/settings', '/security', '/analytics', '/premium', '/notifications', '/favorites', '/achievements'];
  const emailVerifiedRoutes = ['/check', '/chat', '/submit', '/my-submissions'];
  const adminRoutes = ['/admin', '/admin/dashboard', '/admin/firestore-test'];

  if (adminRoutes.some(route => path.startsWith(route))) return 'admin';
  if (emailVerifiedRoutes.some(route => path.startsWith(route))) return 'email-verified';
  if (protectedRoutes.some(route => path.startsWith(route))) return 'protected';
  if (publicRoutes.includes(path)) return 'public';
  
  return 'unknown';
};

export default { validateRoutes, getRouteProtection };
