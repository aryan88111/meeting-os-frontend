import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { MeetingListView } from '@/features/meetings/components/MeetingListView';
import { IntelligenceViewer } from '@/features/intelligence/components/IntelligenceViewer';
import { CalendarView } from '@/features/calendar/components/CalendarView';
import { ActionItemsView } from '@/features/action-items/components/ActionItemsView';
import { KnowledgeBaseView } from '@/features/knowledge/components/KnowledgeBaseView';
import { DocumentsView } from '@/features/documents/components/DocumentsView';
import { SettingsView } from '@/features/settings/components/SettingsView';

import { LoginForm } from '@/features/auth/components/LoginForm';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { AuthCallback } from '@/features/auth/components/AuthCallback';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { IntegrationsView } from '@/features/integrations/components/IntegrationsView';
import { GoogleCallbackView } from '@/features/integrations/components/GoogleCallbackView';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/register',
    element: <RegisterForm />,
  },
  {
    path: '/oauth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/integrations/google/callback',
    element: (
      <AuthGuard>
        <GoogleCallbackView />
      </AuthGuard>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <DashboardView />,
      },
      {
        path: 'meetings',
        element: <MeetingListView />,
      },
      {
        path: 'meetings/:id',
        element: <IntelligenceViewer />,
      },
      {
        path: 'calendar',
        element: <CalendarView />,
      },
      {
        path: 'action-items',
        element: <ActionItemsView />,
      },
      {
        path: 'integrations',
        element: <IntegrationsView />,
      },
      {
        path: 'knowledge',
        element: <KnowledgeBaseView />,
      },
      {
        path: 'documents',
        element: <DocumentsView />,
      },
      {
        path: 'settings',
        element: <SettingsView />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
