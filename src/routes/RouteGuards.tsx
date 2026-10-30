import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', maxWidth: 600, margin: '0 auto' }}>
        <Skeleton width="100%" height={240} borderRadius={16} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const RequireMaintenanceRole: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isMaintenanceStaff } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', maxWidth: 600, margin: '0 auto' }}>
        <Skeleton width="100%" height={240} borderRadius={16} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isMaintenanceStaff) {
    // Non-maintenance staff redirected to student/reporter dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const RequireAdminRole: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', maxWidth: 600, margin: '0 auto' }}>
        <Skeleton width="100%" height={240} borderRadius={16} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Root index redirector based on authenticated role.
 */
export const RootRedirect: React.FC = () => {
  const { isAuthenticated, isMaintenanceStaff, isAdmin, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isMaintenanceStaff) {
    return <Navigate to="/maintenance" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};
