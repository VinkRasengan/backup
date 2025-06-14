import React from 'react';
import AppLayout from './AppLayout';

/**
 * withLayout - Higher Order Component to wrap pages with AppLayout
 * Usage: export default withLayout(MyPage);
 */
const withLayout = (WrappedComponent) => {
  const WithLayoutComponent = (props) => {
    return (
      <AppLayout>
        <WrappedComponent {...props} />
      </AppLayout>
    );
  };

  // Set display name for debugging
  WithLayoutComponent.displayName = `withLayout(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithLayoutComponent;
};

export default withLayout;
