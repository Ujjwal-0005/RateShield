import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute, PublicRoute } from './Guards';
import { LoginPage }     from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PoliciesPage }  from '../pages/PoliciesPage';
import { ApiKeysPage }   from '../pages/ApiKeysPage';
import { SettingsPage }  from '../pages/SettingsPage';
import { NotFoundPage }  from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  /* ── Public ───────────────────────────── */
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },

  /* ── Protected dashboard shell ─────────── */
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        handle: { crumb: 'Dashboard' },
      },
      {
        path: 'policies',
        element: <PoliciesPage />,
        handle: { crumb: 'Policies' },
      },
      {
        path: 'api-keys',
        element: <ApiKeysPage />,
        handle: { crumb: 'API Keys' },
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        handle: { crumb: 'Settings' },
      },
    ],
  },

  /* ── 404 ───────────────────────────────── */
  { path: '*', element: <NotFoundPage /> },
]);
