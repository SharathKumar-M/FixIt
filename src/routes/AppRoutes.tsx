import React from 'react';
import { Routes, Route } from 'react-router';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CreateTicketPage } from '@/features/tickets/CreateTicketPage';
import { TicketsListPage } from '@/features/tickets/TicketsListPage';
import { TicketDetailPage } from '@/features/tickets/TicketDetailPage';
import { ResolutionsPage } from '@/features/tickets/ResolutionsPage';
import { MaintenanceDashboardPage } from '@/features/maintenance/MaintenanceDashboardPage';
import { MaintenanceWorkbenchPage } from '@/features/maintenance/MaintenanceWorkbenchPage';
import { DeadlineManagerPage } from '@/features/maintenance/DeadlineManagerPage';
import { IssueTypeManagerPage } from '@/features/issue-types/IssueTypeManagerPage';
import { AdminPage } from '@/features/admin/AdminPage';
import { RequireAuth, RequireMaintenanceRole, RequireAdminRole, RootRedirect } from './RouteGuards';
import { EmptyState, Button } from '@/components/ui';

const NotFound: React.FC = () => (
  <div style={{ padding: '4rem 1.5rem', maxWidth: 600, margin: '0 auto' }}>
    <EmptyState
      title="404 — Page Not Found"
      description="The requested page does not exist or has been moved."
      action={
        <Button variant="primary" onClick={() => window.location.assign('/dashboard')}>
          Back to Dashboard
        </Button>
      }
    />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root Role Dispatcher */}
      <Route path="/" element={<RootRedirect />} />

      {/* Authenticated Workspace */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        {/* Student & Reporter Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="/resolutions" element={<ResolutionsPage />} />

        {/* Campus Maintenance Operations Routes */}
        <Route
          path="/maintenance"
          element={
            <RequireMaintenanceRole>
              <MaintenanceDashboardPage />
            </RequireMaintenanceRole>
          }
        />
        <Route
          path="/maintenance/tickets"
          element={
            <RequireMaintenanceRole>
              <MaintenanceWorkbenchPage />
            </RequireMaintenanceRole>
          }
        />
        <Route
          path="/maintenance/deadlines"
          element={
            <RequireMaintenanceRole>
              <DeadlineManagerPage />
            </RequireMaintenanceRole>
          }
        />
        <Route
          path="/maintenance/issue-types"
          element={
            <RequireMaintenanceRole>
              <IssueTypeManagerPage />
            </RequireMaintenanceRole>
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <RequireAdminRole>
              <AdminPage />
            </RequireAdminRole>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
