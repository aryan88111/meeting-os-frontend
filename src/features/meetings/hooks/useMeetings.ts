import { useQuery } from '@tanstack/react-query';
import { meetingsControllerListMeetings } from '@/api';

export interface MeetingItem {
  id: string;
  title: string;
  description?: string;
  provider?: string;
  meetingUrl?: string;
  startTime?: string;
  endTime?: string;
  durationSeconds?: number;
  status: string;
  decisionsCount?: number;
  actionsCount?: number;
  pendingActionsCount?: number;
  hasSummary?: boolean;
  actionItems?: Array<{
    id: string;
    status: string;
    priority: string;
  }>;
  decisions?: Array<{
    id: string;
  }>;
  participants: Array<{
    id: string;
    name: string;
    email?: string;
    role?: string;
    isExternal?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingsResponse {
  total: number;
  limit: number;
  offset: number;
  items: MeetingItem[];
}

export const useMeetingsQuery = (params?: { search?: string; status?: any; limit?: number; offset?: number }) => {
  return useQuery<MeetingsResponse>({
    queryKey: ['meetings', params],
    queryFn: async () => {
      const response = await meetingsControllerListMeetings({
        query: {
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.status && params.status !== 'ALL' ? { status: params.status } : {}),
          limit: params?.limit ?? 100,
          offset: params?.offset ?? 0,
        },
      });
      if (response.error) {
        throw new Error('Failed to fetch meetings');
      }
      return (response.data as unknown) as MeetingsResponse;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30, // Background refresh every 30s
  });
};
