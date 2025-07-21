import { validateRoutes, getRouteProtection } from '../utils/routeValidator';

describe('Routing Tests', () => {
  test('should validate all routes are consistent', () => {
    const validation = validateRoutes();
    
    console.log('Route Validation Results:');
    console.log('App Routes:', validation.appRoutes.length);
    console.log('Sidebar Routes:', validation.sidebarRoutes.length);
    console.log('Mobile Tab Routes:', validation.mobileTabRoutes.length);
    
    if (validation.sidebarOnlyRoutes.length > 0) {
      console.log('Routes in sidebar but not in app:', validation.sidebarOnlyRoutes);
    }
    
    if (validation.mobileOnlyRoutes.length > 0) {
      console.log('Routes in mobile tab but not in app:', validation.mobileOnlyRoutes);
    }
    
    expect(validation.isValid).toBe(true);
  });

  test('should correctly identify route protection levels', () => {
    expect(getRouteProtection('/')).toBe('public');
    expect(getRouteProtection('/login')).toBe('public');
    expect(getRouteProtection('/dashboard')).toBe('protected');
    expect(getRouteProtection('/check')).toBe('email-verified');
    expect(getRouteProtection('/admin')).toBe('admin');
    expect(getRouteProtection('/admin/dashboard')).toBe('admin');
  });

  test('should handle dynamic routes', () => {
    expect(getRouteProtection('/knowledge/123')).toBe('public');
    expect(getRouteProtection('/settings/account')).toBe('protected');
  });
});
