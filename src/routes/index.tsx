import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPageView } from '@/features/landing/components/LandingPageView';
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
import { VideoCallRoom } from '@/features/video-call';

/**
 * Fallback root handler: if an OAuth provider/Supabase ever lands on `/` with
 * token fragments or authorization codes instead of `/oauth/callback`, hand off
 * seamlessly to AuthCallback rather than rendering the marketing landing page.
 */
const RootRoute: React.FC = () => {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const searchParams = new URLSearchParams(search);

  const hasOAuthPayload =
    hashParams.has('access_token') ||
    hashParams.has('refresh_token') ||
    hashParams.has('provider_token') ||
    hashParams.has('error_description') ||
    searchParams.has('code') ||
    searchParams.has('error_description');

  return hasOAuthPayload ? <AuthCallback /> : <LandingPageView />;
};

export const router = createBrowserRouter([
  // Fullscreen WebRTC SFU Video Call Room
  {
    path: '/meetings/:id/call',
    element: (
      <AuthGuard>
        <VideoCallRoom />
      </AuthGuard>
    ),
  },
  {
    path: '/room/:id',
    element: <VideoCallRoom />,
  },

  // Public Landing Page (with OAuth callback fallback)
  {
    path: '/',
    element: <RootRoute />,
  },
  // Public Auth Pages
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
  // Authenticated Workspace Routes (under /app, /dashboard, and direct shortcuts)
  {
    path: '/app',
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
    ],
  },
  // Direct Top-Level Workspace Routes
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: 'dashboard',
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
