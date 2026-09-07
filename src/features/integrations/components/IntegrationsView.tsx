import React, { useEffect, useState } from 'react';
import {
  RiApps2Line,
  RiRefreshLine,
  RiCheckboxCircleFill,
  RiLinkM,
  RiVideoChatLine,
  RiLoader4Line,
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { SiZoom } from 'react-icons/si';
import { RiTeamLine } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  integrationsControllerListIntegrations,
  integrationsControllerSyncGoogleCalendar,
  integrationsControllerScanRecentTranscripts,
} from '@/api';
import { useAuthStore } from '@/stores/auth.store';

interface IntegrationItem {
  id: string;
  provider: string;
  account?: string;
  status: string;
  connectedAt: string;
}

export const IntegrationsView: React.FC = () => {
  const { loginWithOAuth } = useAuthStore();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      const res = await integrationsControllerListIntegrations();
      if (res.data) {
        const data = res.data as any;
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.warn('Failed to fetch integrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnectGoogle = async () => {
    setErrorMessage(null);
    try {
      await loginWithOAuth('google');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initiate Google Calendar connection');
    }
  };

  const handleSyncGoogle = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await integrationsControllerSyncGoogleCalendar();
      if (res.data) {
        const data = res.data as any;
        setSyncMessage(`Successfully synced ${data.syncedCount || 0} meetings from Google Calendar!`);
        setTimeout(() => setSyncMessage(null), 4000);
      } else if (res.error) {
        const errData = res.error as any;
        setSyncMessage(errData?.message || 'Sync failed');
      }
    } catch (err: any) {
      setSyncMessage(err.message || 'Failed to sync calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleScanTranscripts = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await integrationsControllerScanRecentTranscripts();
      if (res.data) {
        const data = res.data as any;
        setSyncMessage(`Scanned ${data.scannedCount || 0} ended meetings for Google Meet transcripts.`);
        setTimeout(() => setSyncMessage(null), 4000);
      } else if (res.error) {
        const errData = res.error as any;
        setSyncMessage(errData?.message || 'Scan failed');
      }
    } catch (err: any) {
      setSyncMessage(err.message || 'Failed to scan transcripts');
    } finally {
      setIsSyncing(false);
    }
  };

  const googleIntegration = integrations.find((i) => i.provider === 'GOOGLE_MEET');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RiApps2Line className="w-5 h-5 text-primary" /> Workspace Integrations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect your video conferencing platforms and calendars to automatically import meeting sessions.
          </p>
        </div>
        {googleIntegration && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncGoogle}
            disabled={isSyncing}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <RiRefreshLine className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync All Now'}</span>
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
          <div className="font-bold">Google Calendar Connection Note:</div>
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center gap-2">
          <RiCheckboxCircleFill className="w-4 h-4 flex-shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Grid of integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Google Calendar & Meet */}
        <Card className="border-border shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shadow-xs">
                <FcGoogle className="w-6 h-6" />
              </div>
              {googleIntegration ? (
                googleIntegration.status === 'ACTIVE' ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                    Re-auth Required
                  </Badge>
                )
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  Available
                </Badge>
              )}
            </div>
            <CardTitle className="text-sm font-bold pt-2">Google Calendar & Meet</CardTitle>
            <CardDescription className="text-xs">
              Automatically import upcoming Google Meet calls, calendar events, and attendee invites.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {googleIntegration ? (
              <div className="space-y-3">
                <div className="text-[11px] text-muted-foreground truncate">
                  Account: <span className="font-semibold text-foreground">{googleIntegration.account || 'Connected'}</span>
                </div>
                {googleIntegration.status === 'AUTH_REQUIRED' && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 space-y-2">
                    <p>OAuth session expired or revoked. Please re-authenticate to sync meetings.</p>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleConnectGoogle}
                      className="w-full h-7 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Reconnect Google Account
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSyncGoogle}
                    disabled={isSyncing || googleIntegration.status === 'AUTH_REQUIRED'}
                    className="flex-1 h-8 text-xs"
                  >
                    {isSyncing ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin mr-1" /> : <RiRefreshLine className="w-3.5 h-3.5 mr-1" />}
                    Sync Events
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScanTranscripts}
                    disabled={isSyncing || googleIntegration.status === 'AUTH_REQUIRED'}
                    className="h-8 text-xs"
                    title="Scan Google Drive & Calendar for ended meeting transcripts"
                  >
                    {isSyncing ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin mr-1" /> : <RiVideoChatLine className="w-3.5 h-3.5 mr-1 text-primary" />}
                    Scan Transcripts
                  </Button>
                  {googleIntegration.status === 'ACTIVE' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleConnectGoogle}
                      className="h-8 text-xs"
                    >
                      Reconnect
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleConnectGoogle}
                className="w-full h-8 text-xs shadow-xs"
              >
                <RiLinkM className="w-3.5 h-3.5 mr-1.5" /> Connect Google Calendar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Zoom */}
        <Card className="border-border shadow-xs opacity-80 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <SiZoom className="w-6 h-6 text-blue-500" />
              </div>
              <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
            </div>
            <CardTitle className="text-sm font-bold pt-2">Zoom Meetings</CardTitle>
            <CardDescription className="text-xs">
              Direct webhook ingest for cloud recordings and live Zoom meeting transcripts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" size="sm" disabled className="w-full h-8 text-xs">
              Phase 2 Integration
            </Button>
          </CardContent>
        </Card>

        {/* Microsoft Teams */}
        <Card className="border-border shadow-xs opacity-80 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <RiTeamLine className="w-6 h-6 text-purple-500" />
              </div>
              <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
            </div>
            <CardTitle className="text-sm font-bold pt-2">Microsoft Teams</CardTitle>
            <CardDescription className="text-xs">
              Synchronize Microsoft 365 Calendar and automated Graph API meeting transcripts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" size="sm" disabled className="w-full h-8 text-xs">
              Phase 2 Integration
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
