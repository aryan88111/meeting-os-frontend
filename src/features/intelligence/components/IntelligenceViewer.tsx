import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  RiSparklingFill,
  RiTimeLine,
  RiShareForwardLine,
  RiFilePdfLine,
  RiFileWordLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiAlertLine,
  RiUploadCloud2Line,
  RiRefreshLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiCheckboxCircleFill,
  RiUser3Line,
  RiQuestionLine,
  RiSearch2Line,
  RiExternalLinkLine,
  RiGroupLine,
  RiDeleteBin6Line,
  RiTeamLine,
  RiVideoChatLine,
  RiFileCopyLine,
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { SiZoom } from 'react-icons/si';
import { UploadTranscriptModal } from '@/features/transcripts/components/UploadTranscriptModal';
import { DeleteMeetingModal } from '@/features/meetings/components/DeleteMeetingModal';
import { meetingsControllerGetMeeting, integrationsControllerSyncGoogleMeetTranscript } from '@/api';

interface Participant {
  id: string;
  name: string;
  email?: string;
  role?: string;
  isExternal?: boolean;
}

interface Summary {
  id: string;
  overview?: string;
  keyTakeaways?: string[];
  actionPlan?: string;
  createdAt: string;
}

interface Decision {
  id: string;
  topic?: string;
  decision: string;
  rationale?: string;
  confidenceScore?: number;
  speakerName?: string;
  timestampStartMs?: number | bigint;
}

interface ActionItem {
  id: string;
  task: string;
  description?: string;
  assignee?: { id: string; name: string; email?: string };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
}

interface Risk {
  id: string;
  risk: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigation?: string;
}

interface OpenQuestion {
  id: string;
  question: string;
  status: string;
}

interface TranscriptSegment {
  id: string;
  speakerName: string;
  text: string;
  startTimeMs: number | bigint;
  endTimeMs: number | bigint;
  sequence: number;
}

interface Transcript {
  id: string;
  source: string;
  status: string;
  createdAt: string;
  segments: TranscriptSegment[];
}

interface MeetingDetails {
  id: string;
  title: string;
  description?: string;
  provider?: string;
  source?: string;
  meetingUrl?: string;
  startTime?: string;
  endTime?: string;
  durationSeconds?: number;
  status: string;
  createdAt: string;
  participants: Participant[];
  summaries: Summary[];
  decisions: Decision[];
  actionItems: ActionItem[];
  risks: Risk[];
  openQuestions: OpenQuestion[];
  transcripts: Transcript[];
}

export const IntelligenceViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCopyInvite = () => {
    if (!meeting) return;
    const text = meeting.meetingUrl
      ? `Meeting: ${meeting.title}\nTime: ${formatMeetingDate(meeting.startTime || meeting.createdAt)}\nJoin Video Call: ${meeting.meetingUrl}`
      : `Meeting: ${meeting.title}\nTime: ${formatMeetingDate(meeting.startTime || meeting.createdAt)}`;

    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const fetchMeeting = useCallback(async () => {
    if (!id) return;
    try {
      const response = await meetingsControllerGetMeeting({
        path: { id },
      });
      if (response.data) {
        setMeeting(response.data as any);
      }
    } catch (err) {
      console.error('Failed to fetch meeting details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  // Polling if status is PROCESSING
  useEffect(() => {
    if (meeting?.status === 'PROCESSING') {
      pollingRef.current = setInterval(() => {
        fetchMeeting();
      }, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [meeting?.status, fetchMeeting]);

  // Trigger Google Meet transcript pull
  const handleSyncGoogleTranscript = async () => {
    if (!id) return;
    setIsSyncingGoogle(true);
    setSyncStatusMsg(null);

    try {
      const response = await integrationsControllerSyncGoogleMeetTranscript({
        path: { meetingId: id },
      });

      if (response.error) {
        const errData = response.error as any;
        setSyncStatusMsg({
          type: 'error',
          text: errData?.message || 'Could not find transcript doc on Google Drive yet. If the meeting just ended, Google takes 1-2 mins to write the transcript file.',
        });
      } else {
        const data = response.data as any;
        setSyncStatusMsg({
          type: 'success',
          text: data?.message || 'Google Meet transcript fetched! AI extraction queued.',
        });
        fetchMeeting();
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Network error syncing transcript from Google Meet',
      });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const formatTime = (ms?: number | bigint) => {
    if (ms === undefined || ms === null) return '00:00';
    const totalSecs = Math.floor(Number(ms) / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMeetingDate = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'GOOGLE_MEET':
        return <FcGoogle className="w-5 h-5" title="Google Meet" />;
      case 'ZOOM':
        return <SiZoom className="w-5 h-5 text-blue-500" title="Zoom" />;
      case 'MICROSOFT_TEAMS':
        return <RiTeamLine className="w-5 h-5 text-purple-500" title="Microsoft Teams" />;
      default:
        return <RiVideoChatLine className="w-5 h-5 text-muted-foreground" title="Meeting" />;
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
            Ready / Analyzed
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px] animate-pulse">
            AI Processing
          </Badge>
        );
      case 'WAITING_FOR_TRANSCRIPT':
      case 'CREATED':
      default:
        return (
          <Badge variant="secondary" className="text-[10px]">
            Transcript Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <RiLoader4Line className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-medium">Loading meeting intelligence...</span>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-12 text-center space-y-4">
        <RiAlertLine className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-base font-bold text-foreground">Meeting Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested meeting session could not be located.</p>
        <Link to="/meetings">
          <Button size="sm" variant="outline" className="text-xs">
            <RiArrowLeftLine className="mr-1.5" /> Back to Meetings
          </Button>
        </Link>
      </div>
    );
  }

  const latestTranscript = meeting.transcripts?.[0];
  const segments = latestTranscript?.segments || [];
  const latestSummary = meeting.summaries?.[0];

  const filteredSegments = segments.filter(
    (seg) =>
      seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      seg.speakerName.toLowerCase().includes(transcriptSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link to="/meetings">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <RiArrowLeftLine className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {renderProviderIcon(meeting.provider || meeting.source)}
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                {meeting.title}
              </h1>
              {renderStatusBadge(meeting.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{formatMeetingDate(meeting.startTime || meeting.createdAt)}</span>
              {meeting.durationSeconds && <span>• {Math.round(meeting.durationSeconds / 60)} mins duration</span>}
              <span>• Source: {meeting.provider || meeting.source || 'Manual'}</span>
              {meeting.meetingUrl && (
                <a
                  href={meeting.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline ml-1"
                >
                  Join URL <RiExternalLinkLine className="w-3 h-3" />
                </a>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Join Video Call Button */}
          {meeting.meetingUrl && (
            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs">
                <RiExternalLinkLine className="w-3.5 h-3.5 mr-1.5" />
                Join Video Call
              </Button>
            </a>
          )}

          {/* Copy Invite / Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyInvite}
            className="h-8 text-xs border-border hover:bg-muted"
            title="Copy meeting link and details to clipboard"
          >
            {copiedLink ? (
              <>
                <RiCheckLine className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <RiFileCopyLine className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <span>Copy Invite</span>
              </>
            )}
          </Button>

          {/* Sync from Google Meet Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncGoogleTranscript}
            disabled={isSyncingGoogle || meeting.status === 'PROCESSING'}
            className="h-8 text-xs border-primary/30 text-foreground hover:bg-primary/5"
            title="Fetch transcript Google Doc from Google Drive / Calendar"
          >
            {isSyncingGoogle ? (
              <RiLoader4Line className="h-3.5 w-3.5 mr-1.5 animate-spin text-primary" />
            ) : (
              <FcGoogle className="h-3.5 w-3.5 mr-1.5" />
            )}
            <span>{isSyncingGoogle ? 'Fetching Drive...' : 'Sync Meet Transcript'}</span>
          </Button>

          {/* Upload Transcript File Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="h-8 text-xs"
          >
            <RiUploadCloud2Line className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Upload File
          </Button>

          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RiFileWordLine className="h-3.5 w-3.5 mr-1.5" />
            DOCX
          </Button>
          <Button variant="default" size="sm" className="h-8 text-xs shadow-xs">
            <RiFilePdfLine className="h-3.5 w-3.5 mr-1.5" />
            PDF Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
            title="Delete meeting and remove from provider calendars"
          >
            <RiDeleteBin6Line className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Sync Status Feedback Toast/Banner */}
      {syncStatusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatusMsg.type === 'success' ? (
              <RiCheckboxCircleFill className="w-4 h-4 shrink-0" />
            ) : (
              <RiErrorWarningLine className="w-4 h-4 shrink-0" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSyncStatusMsg(null)}
            className="h-6 text-[10px] px-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Processing State Banner */}
      {meeting.status === 'PROCESSING' && (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-3 animate-pulse">
          <RiLoader4Line className="w-5 h-5 animate-spin shrink-0 text-purple-500" />
          <div className="flex-1">
            <p className="font-semibold">AI Intelligence Engine is Processing Transcript...</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              Generating executive summary, identifying key decisions with citations, action items with assignees, and assessing risks.
            </p>
          </div>
        </div>
      )}

      {/* Empty / Pending Transcript Banner */}
      {(!segments || segments.length === 0) && meeting.status !== 'PROCESSING' && (
        <Card className="border-border shadow-xs border-dashed bg-muted/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <RiUploadCloud2Line className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-semibold text-sm text-foreground">No Transcript Ingested Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you enabled recording/transcripts during your Google Meet call, Google Workspace writes the transcript document to your Google Drive inside the <strong>Meet Recordings</strong> folder.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="sm"
                onClick={handleSyncGoogleTranscript}
                disabled={isSyncingGoogle}
                className="h-8 text-xs"
              >
                {isSyncingGoogle ? (
                  <RiLoader4Line className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <FcGoogle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Pull from Google Meet
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsUploadOpen(true)}
                className="h-8 text-xs"
              >
                <RiUploadCloud2Line className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Upload File (.txt, .json, .vtt)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Structured Intelligence Tabs */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="bg-muted/50 p-1 border border-border flex flex-wrap h-auto">
          <TabsTrigger value="overview" className="text-xs">
            Executive Summary
          </TabsTrigger>
          <TabsTrigger value="decisions" className="text-xs">
            Decisions ({meeting.decisions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">
            Action Items ({meeting.actionItems?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="risks" className="text-xs">
            Risks & Blockers ({meeting.risks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="questions" className="text-xs">
            Open Questions ({meeting.openQuestions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="transcript" className="text-xs">
            Full Transcript ({segments.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          <Card className="shadow-xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <RiSparklingFill className="h-4 w-4" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-sm text-foreground/90 leading-relaxed space-y-3">
              {latestSummary?.overview ? (
                <div className="space-y-3">
                  <p>{latestSummary.overview}</p>
                  {latestSummary.keyTakeaways && latestSummary.keyTakeaways.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-foreground mb-2">Key Takeaways:</h4>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                        {latestSummary.keyTakeaways.map((takeaway, i) => (
                          <li key={i}>{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {meeting.status === 'PROCESSING'
                    ? 'AI summary is currently generating...'
                    : 'No summary generated yet. Ingest or sync a transcript to generate intelligence.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Decision & Action highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Key Decisions</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {meeting.decisions?.length || 0} Identified
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2.5">
                {meeting.decisions && meeting.decisions.length > 0 ? (
                  meeting.decisions.slice(0, 3).map((d) => (
                    <div key={d.id} className="p-2.5 rounded-lg border border-border bg-card text-xs">
                      <p className="font-medium text-foreground">{d.decision}</p>
                      {d.speakerName && (
                        <span className="text-[10px] text-muted-foreground block mt-1">
                          Speaker: {d.speakerName} {d.timestampStartMs ? `• Grounded at ${formatTime(d.timestampStartMs)}` : ''}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No decisions recorded yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Action Items</span>
                  <Badge variant="warning" className="text-[10px]">
                    {meeting.actionItems?.length || 0} Total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2.5">
                {meeting.actionItems && meeting.actionItems.length > 0 ? (
                  meeting.actionItems.slice(0, 3).map((a) => (
                    <div key={a.id} className="p-2.5 rounded-lg border border-border bg-card text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{a.task}</p>
                        {a.assignee && (
                          <span className="text-[10px] font-semibold text-primary">{a.assignee.name}</span>
                        )}
                      </div>
                      {a.dueDate && (
                        <span className="text-[10px] text-muted-foreground block mt-1">
                          Due: {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No action items recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Decisions */}
        <TabsContent value="decisions" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3">
              {meeting.decisions && meeting.decisions.length > 0 ? (
                meeting.decisions.map((d, index) => (
                  <div key={d.id} className="p-3.5 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">
                        {index + 1}. {d.topic || 'Decision'}
                      </span>
                      {d.confidenceScore !== undefined && (
                        <Badge variant="success" className="text-[10px]">
                          Confidence: {Math.round(d.confidenceScore * 100)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground/90 mt-1.5 font-medium">{d.decision}</p>
                    {d.rationale && (
                      <p className="text-xs text-muted-foreground mt-1">{d.rationale}</p>
                    )}
                    {d.timestampStartMs !== undefined && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                        <RiTimeLine className="h-3 w-3" />
                        <span>
                          Timestamp Citation: {formatTime(d.timestampStartMs)} {d.speakerName ? `• Speaker: ${d.speakerName}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-4 text-center italic">
                  No structured decisions identified for this meeting.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Action Items */}
        <TabsContent value="actions" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3">
              {meeting.actionItems && meeting.actionItems.length > 0 ? (
                meeting.actionItems.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-lg border border-border bg-card flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border border-border flex items-center justify-center text-[10px]">
                          <RiCheckLine className="h-2.5 w-2.5 text-primary" />
                        </span>
                        <span className="font-semibold text-xs text-foreground">{a.task}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 ml-6">
                        Assignee: <strong>{a.assignee?.name || 'Unassigned'}</strong> • Priority:{' '}
                        <strong>{a.priority}</strong> • Status: <strong>{a.status}</strong>
                        {a.dueDate && ` • Deadline: ${new Date(a.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Badge variant={a.status === 'COMPLETED' ? 'success' : 'info'} className="text-[10px]">
                      {a.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-4 text-center italic">
                  No action items identified for this meeting.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Risks */}
        <TabsContent value="risks" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3">
              {meeting.risks && meeting.risks.length > 0 ? (
                meeting.risks.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5 text-destructive">
                        <RiAlertLine className="h-3.5 w-3.5" />
                        {r.risk}
                      </span>
                      <Badge variant="destructive" className="text-[10px]">
                        {r.severity} Severity
                      </Badge>
                    </div>
                    {r.mitigation && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        <strong>Mitigation:</strong> {r.mitigation}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-4 text-center italic">
                  No critical risks or blockers identified.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Open Questions */}
        <TabsContent value="questions" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3">
              {meeting.openQuestions && meeting.openQuestions.length > 0 ? (
                meeting.openQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                    <RiQuestionLine className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-xs text-foreground">{idx + 1}. {q.question}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-4 text-center italic">
                  No open questions recorded.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Full Transcript */}
        <TabsContent value="transcript" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <RiSearch2Line className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Search transcript by speaker or phrase..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background outline-hidden focus:border-primary"
                />
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {filteredSegments.length} of {segments.length} segments
              </span>
            </div>

            <CardContent className="p-4 space-y-3 font-mono text-xs text-muted-foreground divide-y divide-border max-h-[600px] overflow-y-auto">
              {filteredSegments.length > 0 ? (
                filteredSegments.map((seg) => (
                  <div key={seg.id} className="pt-3 first:pt-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-foreground font-mono">
                        [{formatTime(seg.startTimeMs)}]
                      </span>
                      <span className="font-bold text-foreground">{seg.speakerName}:</span>
                    </div>
                    <p className="text-foreground/90 pl-1 leading-relaxed whitespace-pre-wrap">{seg.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-8 text-center italic">
                  {segments.length === 0
                    ? 'No transcript segments available. Ingest a transcript using the button above.'
                    : 'No segments match your search.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Transcript Modal */}
      <UploadTranscriptModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchMeeting}
        preselectedMeetingId={meeting.id}
      />

      {/* Delete Meeting Modal */}
      <DeleteMeetingModal
        isOpen={isDeleteOpen}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        provider={meeting.provider || meeting.source}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => navigate('/meetings')}
      />
    </div>
  );
};
