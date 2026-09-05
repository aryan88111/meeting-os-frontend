import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { MeetingListView } from '@/features/meetings/components/MeetingListView';
import { IntelligenceViewer } from '@/features/intelligence/components/IntelligenceViewer';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
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
        path: 'action-items',
        element: <IntelligenceViewer />,
      },
      {
        path: 'knowledge',
        element: <DashboardView />,
      },
      {
        path: 'documents',
        element: <MeetingListView />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
