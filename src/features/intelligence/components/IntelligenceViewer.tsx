import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
  RiDownload2Line,
  RiArrowDownSLine,
  RiMore2Fill,
  RiMarkdownLine,
  RiCalendarLine,
  RiShieldCheckLine,
  RiCloseLine,
  RiMailLine,
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { SiZoom } from 'react-icons/si';
import { UploadTranscriptModal } from '@/features/transcripts/components/UploadTranscriptModal';
import { DeleteMeetingModal } from '@/features/meetings/components/DeleteMeetingModal';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { FormattedDiscussion } from './FormattedDiscussion';
import {
  meetingsControllerGetMeeting,
  integrationsControllerSyncGoogleMeetTranscript,
  integrationsControllerSyncMicrosoftTeamsTranscript,
  documentsControllerExportDocument,
  intelligenceControllerProcessIntelligence,
} from '@/api';

interface Participant {
  id: string;
  name: string;
  email?: string;
  role?: string;
  isExternal?: boolean;
}

interface Topic {
  id: string;
  title: string;
  summary: string;
  importance?: number;
}

interface Summary {
  id: string;
  executiveSummary?: string;
  summary?: string;
  overview?: string;
  keyTakeaways?: string[];
  actionPlan?: string;
  createdAt: string;
}

interface Decision {
  id: string;
  topic?: string;
  decision: string;
  context?: string;
  rationale?: string;
  confidence?: number;
  confidenceScore?: number;
  speakerName?: string;
  sourceSegmentId?: string;
  timestampStartMs?: number | bigint;
}

interface ActionItem {
  id: string;
  task?: string;
  description?: string;
  assigneeName?: string;
  assignee?: { id: string; name: string; email?: string };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  deadline?: string;
  dueDate?: string;
  sourceSegmentId?: string;
}

interface Risk {
  id: string;
  risk?: string;
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
  mitigation?: string;
  confidence?: number;
  sourceSegmentId?: string;
}

interface OpenQuestion {
  id: string;
  question: string;
  assignedTo?: string;
  owner?: string;
  status?: string;
  sourceSegmentId?: string;
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
  topics?: Topic[];
  decisions: Decision[];
  actionItems: ActionItem[];
  risks: Risk[];
  openQuestions: OpenQuestion[];
  transcripts: Transcript[];
}

const SPEAKER_COLORS = [
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
];

const getSpeakerColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return SPEAKER_COLORS[Math.abs(hash) % SPEAKER_COLORS.length];
};

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const IntelligenceViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isSyncingMicrosoft, setIsSyncingMicrosoft] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSegId, setCopiedSegId] = useState<string | null>(null);
  const [copiedEmailKey, setCopiedEmailKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [transcriptSearch, setTranscriptSearch] = useState('');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Clipboard API failed, trying execCommand fallback:', err);
      }
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  };

  const handleCopyEmail = (email: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    copyToClipboard(email);
    setCopiedEmailKey(key);
    setTimeout(() => setCopiedEmailKey(null), 2000);
  };

  const handleCopyAllEmails = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!meeting?.participants) return;
    const emails = meeting.participants
      .filter((p) => p.email && p.email.trim())
      .map((p) => p.email!.trim());
    if (emails.length === 0) return;
    copyToClipboard(emails.join(', '));
    setCopiedEmailKey('all-emails');
    setTimeout(() => setCopiedEmailKey(null), 2000);
  };

  const handleCopyInvite = () => {
    if (!meeting) return;
    const text = meeting.meetingUrl
      ? `Meeting: ${meeting.title}\nTime: ${formatMeetingDate(meeting.startTime || meeting.createdAt)}\nJoin Video Call: ${meeting.meetingUrl}`
      : `Meeting: ${meeting.title}\nTime: ${formatMeetingDate(meeting.startTime || meeting.createdAt)}`;

    copyToClipboard(text);
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

  // Trigger Microsoft Teams transcript pull
  const handleSyncMicrosoftTranscript = async () => {
    if (!id) return;
    setIsSyncingMicrosoft(true);
    setSyncStatusMsg(null);

    try {
      const response = await integrationsControllerSyncMicrosoftTeamsTranscript({
        path: { meetingId: id },
      });

      if (response.error) {
        const errData = response.error as any;
        setSyncStatusMsg({
          type: 'error',
          text: errData?.message || 'Could not find Microsoft Teams transcript yet. Ensure transcription was started in Teams and has finalized.',
        });
      } else {
        const data = response.data as any;
        setSyncStatusMsg({
          type: 'success',
          text: data?.message || 'Microsoft Teams transcript fetched! AI extraction queued.',
        });
        fetchMeeting();
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Network error syncing transcript from Microsoft Teams',
      });
    } finally {
      setIsSyncingMicrosoft(false);
    }
  };

  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const handleProcessIntelligence = async () => {
    if (!meeting) return;
    setIsProcessingAI(true);
    setSyncStatusMsg(null);
    try {
      const response = await intelligenceControllerProcessIntelligence({
        path: { id: meeting.id },
      });
      if (response.data) {
        setSyncStatusMsg({
          type: 'success',
          text: 'AI Intelligence & Executive Summary generated successfully!',
        });
        await fetchMeeting();
      } else if (response.error) {
        setSyncStatusMsg({
          type: 'error',
          text: (response.error as any)?.message || 'Failed to process intelligence',
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Failed to process intelligence',
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleExportDocx = async () => {
    if (!meeting) return;
    try {
      const response = await documentsControllerExportDocument({
        path: { id: meeting.id },
        query: { format: 'docx' },
        parseAs: 'blob',
      });

      if (response.error) {
        throw new Error((response.error as any)?.message || 'Failed to export DOCX document');
      }

      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(meeting.title || 'Meeting_Summary').replace(/[^a-zA-Z0-9_-]/g, '_')}_Summary.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSyncStatusMsg({
        type: 'success',
        text: 'Microsoft Word (.docx) document downloaded successfully!',
      });
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `Export failed: ${err.message}`,
      });
    }
  };

  const handleExportPdf = async () => {
    if (!meeting) return;
    try {
      const response = await documentsControllerExportDocument({
        path: { id: meeting.id },
        query: { format: 'pdf' },
        parseAs: 'blob',
      });

      if (response.error) {
        throw new Error((response.error as any)?.message || 'Failed to generate PDF document');
      }

      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(meeting.title || 'Meeting_Summary').replace(/[^a-zA-Z0-9_-]/g, '_')}_Summary.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSyncStatusMsg({
        type: 'success',
        text: 'PDF document downloaded successfully!',
      });
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `PDF export failed: ${err.message}`,
      });
    }
  };

  const handleExportMarkdown = async () => {
    if (!meeting) return;
    try {
      const response = await documentsControllerExportDocument({
        path: { id: meeting.id },
        query: { format: 'markdown' },
        parseAs: 'text',
      });

      if (response.error) {
        throw new Error((response.error as any)?.message || 'Failed to export Markdown document');
      }

      const blob = new Blob([response.data as string], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(meeting.title || 'Meeting_Summary').replace(/[^a-zA-Z0-9_-]/g, '_')}_Summary.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSyncStatusMsg({
        type: 'success',
        text: 'Markdown summary downloaded successfully!',
      });
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `Export failed: ${err.message}`,
      });
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
          <Badge variant="outline" className="text-xs bg-muted text-foreground border-border font-medium px-2 py-0.5">
            Analyzed
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="outline" className="text-xs bg-muted text-primary border-primary/40 font-medium px-2 py-0.5 animate-pulse">
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border font-normal px-2 py-0.5">
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <RiLoader4Line className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="text-xs">Loading meeting details...</span>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-12 text-center space-y-4">
        <RiAlertLine className="w-8 h-8 text-destructive mx-auto" />
        <h2 className="text-base font-semibold text-foreground">Meeting Not Found</h2>
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

  const handleCopySegment = (seg: TranscriptSegment) => {
    const text = `[${formatTime(seg.startTimeMs)}] ${seg.speakerName}: ${seg.text}`;
    navigator.clipboard.writeText(text);
    setCopiedSegId(seg.id);
    setTimeout(() => setCopiedSegId(null), 2000);
  };

  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) return text;
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-400/25 text-foreground font-semibold px-0.5 rounded-xs border-b border-amber-400/60"
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  const hasTranscript = segments.length > 0;
  const isConcluded = meeting.status === 'COMPLETED' || hasTranscript;

  const renderAttendeesCard = (keyPrefix: string) => {
    if (!meeting?.participants || meeting.participants.length === 0) return null;
    const hasAnyEmail = meeting.participants.some((p) => p.email);

    return (
      <div className="p-5 rounded-lg bg-card border border-border space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <RiGroupLine className="w-3.5 h-3.5 text-primary" />
            <span>Invited Attendees & Email Addresses ({meeting.participants.length})</span>
          </h3>
          {hasAnyEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAllEmails}
              className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer shadow-2xs"
              title="Copy all attendee emails as comma-separated list"
            >
              {copiedEmailKey === 'all-emails' ? (
                <>
                  <RiCheckLine className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">All Emails Copied</span>
                </>
              ) : (
                <>
                  <RiFileCopyLine className="w-3.5 h-3.5" />
                  <span>Copy All Emails</span>
                </>
              )}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {meeting.participants.map((p, idx) => {
            const cardKey = `${keyPrefix}-email-${p.id || idx}`;
            const isCopied = copiedEmailKey === cardKey;
            return (
              <div
                key={p.id || idx}
                className="p-3 rounded-lg bg-muted/40 border border-border/70 flex items-start justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">{p.name || 'Anonymous'}</p>
                    {p.email ? (
                      <a
                        href={`mailto:${p.email}`}
                        className="text-[11px] text-muted-foreground hover:text-primary transition flex items-center gap-1 truncate font-mono"
                        title={`Email: ${p.email}`}
                      >
                        <RiMailLine className="w-3 h-3 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">No email attached</span>
                    )}
                  </div>
                </div>

                {p.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleCopyEmail(p.email!, cardKey, e)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                    title={`Copy ${p.email}`}
                  >
                    {isCopied ? (
                      <span className="text-emerald-500 flex items-center gap-1 text-[11px] font-medium">
                        <RiCheckLine className="w-3 h-3" /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px]">
                        <RiFileCopyLine className="w-3 h-3" /> Copy
                      </span>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Toolbar */}
      <div className="space-y-4 pb-4 border-b border-border">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/meetings" className="hover:text-foreground transition-colors">
              Meetings
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-sm">{meeting.title}</span>
          </div>
          {renderStatusBadge(meeting.status)}
        </div>

        {/* Title and Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center">
                {renderProviderIcon(meeting.provider || meeting.source)}
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {meeting.title}
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
              <span>{formatMeetingDate(meeting.startTime || meeting.createdAt)}</span>
              {meeting.durationSeconds && (
                <>
                  <span>•</span>
                  <span>{Math.round(meeting.durationSeconds / 60)} mins</span>
                </>
              )}
              <span>•</span>
              <span>Source: {meeting.provider || meeting.source || 'Manual'}</span>
              {meeting.meetingUrl && !isConcluded && (
                <>
                  <span>•</span>
                  <a
                    href={meeting.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <span>Join URL</span>
                    <RiExternalLinkLine className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>

            {/* Attendees & Emails List */}
            {meeting.participants && meeting.participants.length > 0 && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <RiGroupLine className="w-3.5 h-3.5 text-primary" />
                  <span>Attendees ({meeting.participants.length}):</span>
                </div>
                {meeting.participants.some((p) => p.email) && (
                  <button
                    type="button"
                    onClick={handleCopyAllEmails}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/80 transition cursor-pointer shadow-2xs"
                    title="Copy all attendee email addresses"
                  >
                    {copiedEmailKey === 'all-emails' ? (
                      <>
                        <RiCheckLine className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">All Copied</span>
                      </>
                    ) : (
                      <>
                        <RiFileCopyLine className="w-3 h-3" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {meeting.participants.map((p, idx) => {
                    const pillKey = `header-email-${p.id || idx}`;
                    const isCopied = copiedEmailKey === pillKey;
                    return (
                      <span
                        key={p.id || idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-muted/70 border border-border/80 text-xs text-foreground font-medium shadow-2xs hover:bg-muted transition"
                        title={p.email ? `Attendee: ${p.name} (${p.email})` : undefined}
                      >
                        <RiUser3Line className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span>{p.name}</span>
                        {p.email && (
                          <span className="inline-flex items-center gap-1 bg-primary/10 pl-1.5 pr-0.5 py-0.2 rounded border border-primary/20">
                            <a
                              href={`mailto:${p.email}`}
                              className="text-[11px] text-primary hover:underline font-mono truncate max-w-[160px]"
                              onClick={(e) => e.stopPropagation()}
                              title={`Mail to ${p.email}`}
                            >
                              {p.email}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopyEmail(p.email!, pillKey, e)}
                              className="p-0.5 rounded hover:bg-primary/20 text-primary transition cursor-pointer"
                              title={`Copy ${p.email}`}
                            >
                              {isCopied ? (
                                <RiCheckLine className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <RiFileCopyLine className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 1. Primary CTA: Join Call (Only for active/upcoming meetings without transcripts) */}
            {meeting.meetingUrl && !isConcluded && (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex"
              >
                <Button size="sm" className="h-8 text-xs font-medium gap-1.5 px-3">
                  <RiExternalLinkLine className="w-3.5 h-3.5" />
                  <span>Join Call</span>
                </Button>
              </a>
            )}

            {/* 2. Core Feature Action: Generate AI */}
            {hasTranscript && (
              <Button
                variant="default"
                size="sm"
                onClick={handleProcessIntelligence}
                disabled={isProcessingAI}
                className="h-8 text-xs gap-1.5 px-3 shadow-xs"
                title="Generate or re-run AI intelligence extraction"
              >
                {isProcessingAI ? (
                  <RiLoader4Line className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
                ) : (
                  <RiSparklingFill className="h-3.5 w-3.5 text-primary-foreground" />
                )}
                <span>{isProcessingAI ? 'Analyzing...' : 'Generate AI'}</span>
              </Button>
            )}

            {/* 3. Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 px-2.5"
                  title="Export options"
                >
                  <RiDownload2Line className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Export</span>
                  <RiArrowDownSLine className="h-3 w-3 text-muted-foreground opacity-60 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1">
                <DropdownMenuLabel>Export Intelligence</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleExportPdf}
                  className="gap-2 py-2 cursor-pointer text-xs"
                >
                  <RiFilePdfLine className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">PDF Document (.pdf)</span>
                    <span className="text-[10px] text-muted-foreground">Standard vector report</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportDocx}
                  className="gap-2 py-2 cursor-pointer text-xs"
                >
                  <RiFileWordLine className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">Word Document (.docx)</span>
                    <span className="text-[10px] text-muted-foreground">100% full-width tables</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportMarkdown}
                  className="gap-2 py-2 cursor-pointer text-xs"
                >
                  <RiMarkdownLine className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">Markdown (.md)</span>
                    <span className="text-[10px] text-muted-foreground">Raw notes & transcript</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 4. Quick Actions Group (Copy Link + More Dropdown) */}
            <div className="flex items-center gap-1 border-l border-border pl-2 ml-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyInvite}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                title={copiedLink ? 'Link copied to clipboard!' : 'Copy meeting link'}
              >
                {copiedLink ? (
                  <RiCheckLine className="w-4 h-4 text-primary transition-all scale-110" />
                ) : (
                  <RiFileCopyLine className="w-4 h-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="More actions"
                  >
                    <RiMore2Fill className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1">
                  {meeting.provider === 'MICROSOFT_TEAMS' ? (
                    <DropdownMenuItem
                      onClick={handleSyncMicrosoftTranscript}
                      disabled={isSyncingMicrosoft || meeting.status === 'PROCESSING'}
                      className="gap-2 py-2 cursor-pointer text-xs"
                    >
                      {isSyncingMicrosoft ? (
                        <RiLoader4Line className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <RiTeamLine className="w-4 h-4 text-purple-500" />
                      )}
                      <span>Sync Teams Transcript</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={handleSyncGoogleTranscript}
                      disabled={isSyncingGoogle || meeting.status === 'PROCESSING'}
                      className="gap-2 py-2 cursor-pointer text-xs"
                    >
                      {isSyncingGoogle ? (
                        <RiLoader4Line className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <FcGoogle className="w-4 h-4" />
                      )}
                      <span>Sync Google Meet</span>
                    </DropdownMenuItem>
                  )}

                  {meeting.provider !== 'MICROSOFT_TEAMS' && meeting.provider !== 'GOOGLE_MEET' && (
                    <DropdownMenuItem
                      onClick={handleSyncMicrosoftTranscript}
                      disabled={isSyncingMicrosoft || meeting.status === 'PROCESSING'}
                      className="gap-2 py-2 cursor-pointer text-xs"
                    >
                      {isSyncingMicrosoft ? (
                        <RiLoader4Line className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <RiTeamLine className="w-4 h-4 text-purple-500" />
                      )}
                      <span>Sync Teams Transcript</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => setIsUploadOpen(true)}
                    className="gap-2 py-2 cursor-pointer text-xs"
                  >
                    <RiUploadCloud2Line className="w-4 h-4 text-muted-foreground" />
                    <span>Upload Transcript</span>
                  </DropdownMenuItem>

                  {meeting.meetingUrl && (
                    <DropdownMenuItem asChild className="gap-2 py-2 cursor-pointer text-xs">
                      <a href={meeting.meetingUrl} target="_blank" rel="noreferrer">
                        <RiExternalLinkLine className="w-4 h-4 text-muted-foreground" />
                        <span>Open Meet Link</span>
                      </a>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setIsDeleteOpen(true)}
                    className="gap-2 py-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-xs"
                  >
                    <RiDeleteBin6Line className="w-4 h-4" />
                    <span>Delete Meeting</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Sync / Export Notification Toast */}
      {syncStatusMsg && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            syncStatusMsg.type === 'success'
              ? 'bg-muted border-border text-foreground'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatusMsg.type === 'success' ? (
              <RiCheckboxCircleFill className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <RiErrorWarningLine className="w-4 h-4 shrink-0" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSyncStatusMsg(null)}
            className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Processing State Banner */}
      {meeting.status === 'PROCESSING' && (
        <div className="p-4 rounded-lg bg-muted border border-border text-xs text-foreground flex items-center gap-3">
          <RiLoader4Line className="w-4 h-4 animate-spin shrink-0 text-primary" />
          <div className="flex-1 space-y-0.5">
            <p className="font-medium">Transcript processing in progress...</p>
            <p className="text-[11px] text-muted-foreground">
              Extracting executive summary, decisions, action items, and risks.
            </p>
          </div>
        </div>
      )}

      {/* Empty / Pending Transcript Banner */}
      {(!segments || segments.length === 0) && meeting.status !== 'PROCESSING' && (
        <Card className="border-border border-dashed bg-muted/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center mx-auto border border-border">
              <RiUploadCloud2Line className="w-5 h-5" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-semibold text-sm text-foreground">No Transcript Ingested Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sync with {meeting.provider === 'MICROSOFT_TEAMS' ? 'Microsoft Teams' : 'Google Meet'} or upload a transcript file (.txt, .json, .vtt) to generate intelligence.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {meeting.provider === 'MICROSOFT_TEAMS' ? (
                <Button
                  size="sm"
                  onClick={handleSyncMicrosoftTranscript}
                  disabled={isSyncingMicrosoft}
                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSyncingMicrosoft ? (
                    <RiLoader4Line className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <RiTeamLine className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Pull from Teams
                </Button>
              ) : (
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
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsUploadOpen(true)}
                className="h-8 text-xs"
              >
                <RiUploadCloud2Line className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                Upload File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Structured Intelligence Tabs - Linear Style Underline Bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 rounded-none h-10 gap-6 overflow-x-auto flex-nowrap no-scrollbar">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent transition-colors"
          >
            Executive Summary
          </TabsTrigger>
          <TabsTrigger
            value="topics"
            className="rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent transition-colors"
          >
            Topics <span className="ml-1 text-[11px] text-muted-foreground/70 font-mono">{meeting.topics?.length || 0}</span>
          </TabsTrigger>
          <TabsTrigger
            value="decisions"
            className="rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent transition-colors"
          >
            Decisions <span className="ml-1 text-[11px] text-muted-foreground/70 font-mono">{meeting.decisions?.length || 0}</span>
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent transition-colors"
          >
            Action Items <span className="ml-1 text-[11px] text-muted-foreground/70 font-mono">{meeting.actionItems?.length || 0}</span>
          </TabsTrigger>
          <TabsTrigger
            value="risks"
            className="rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent transition-colors"
          >
            Risks <span className="ml-1 text-[11px] text-muted-foreground/70 font-mono">{meeting.risks?.length || 0}</span>
          </TabsTrigger>
          <TabsTrigger
            value="questions"
            className="rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent transition-colors"
          >
            Questions <span className="ml-1 text-[11px] text-muted-foreground/70 font-mono">{meeting.openQuestions?.length || 0}</span>
          </TabsTrigger>
          <TabsTrigger
            value="transcript"
            className="rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent transition-colors"
          >
            Transcript <span className="ml-1 text-[11px] text-muted-foreground/70 font-mono">{segments.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview / Editorial Document */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {latestSummary?.executiveSummary || latestSummary?.overview ? (
            <div className="space-y-8">
              {/* Executive Brief Paragraph */}
              <div className="p-5 rounded-lg bg-card border border-border space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Overview
                </h3>
                <MarkdownRenderer
                  content={latestSummary.executiveSummary || latestSummary.overview || ''}
                  className="text-sm text-foreground/90 leading-relaxed"
                />
              </div>

              {/* Discussion Breakdown */}
              {latestSummary.summary && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Discussion Breakdown
                  </h3>
                  <div className="p-5 rounded-lg bg-card border border-border">
                    <MarkdownRenderer
                      content={latestSummary.summary}
                      className="text-xs text-foreground/85 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {latestSummary.keyTakeaways && latestSummary.keyTakeaways.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key Takeaways
                  </h3>
                  <div className="p-5 rounded-lg bg-card border border-border">
                    <ul className="space-y-2.5">
                      {latestSummary.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-foreground/85 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Quick Side-by-Side Summary of Decisions & Action Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h4 className="text-xs font-semibold text-foreground">Decisions</h4>
                    <span className="text-[11px] font-mono text-muted-foreground">{meeting.decisions?.length || 0} total</span>
                  </div>
                  <div className="space-y-2.5">
                    {meeting.decisions && meeting.decisions.length > 0 ? (
                      meeting.decisions.slice(0, 3).map((d) => (
                        <div key={d.id} className="text-xs space-y-0.5">
                          <p className="font-medium text-foreground">{d.decision}</p>
                          {d.speakerName && (
                            <span className="text-[11px] text-muted-foreground block">
                              {d.speakerName} {d.timestampStartMs ? `• ${formatTime(d.timestampStartMs)}` : ''}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No decisions recorded.</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h4 className="text-xs font-semibold text-foreground">Action Items</h4>
                    <span className="text-[11px] font-mono text-muted-foreground">{meeting.actionItems?.length || 0} total</span>
                  </div>
                  <div className="space-y-2.5">
                    {meeting.actionItems && meeting.actionItems.length > 0 ? (
                      meeting.actionItems.slice(0, 3).map((a) => (
                        <div key={a.id} className="text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{a.description || a.task}</p>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">{a.priority || 'MEDIUM'}</span>
                          </div>
                          {(a.assigneeName || a.assignee?.name) && (
                            <span className="text-[11px] text-muted-foreground block">
                              Assigned to {a.assigneeName || a.assignee?.name}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No action items recorded.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendees & Participants List Card */}
              {renderAttendeesCard('overview')}
            </div>
          ) : (
            <div className="space-y-6">
              {/* If no AI summary yet, still show Attendees */}
              {renderAttendeesCard('overview-fallback')}

              <div className="p-12 text-center text-xs text-muted-foreground italic bg-card rounded-lg border border-border">
                {meeting.status === 'PROCESSING'
                  ? 'Generating summary...'
                  : 'No summary available. Ingest a transcript to generate intelligence.'}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Topics */}
        <TabsContent value="topics" className="space-y-3 mt-0">
          <div className="p-5 rounded-lg bg-card border border-border divide-y divide-border">
            {meeting.topics && meeting.topics.length > 0 ? (
              meeting.topics.map((t, index) => (
                <div key={t.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{index + 1}.</span>
                      <h4 className="font-semibold text-xs text-foreground">
                        {t.title || (t as any).topic}
                      </h4>
                    </div>
                    {t.importance && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Importance: {t.importance}/5
                      </span>
                    )}
                  </div>
                  <div className="pl-5 text-xs text-muted-foreground leading-relaxed">
                    <MarkdownRenderer content={t.summary} className="text-xs text-muted-foreground" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-6 text-center italic">
                No discussion topics identified.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Decisions */}
        <TabsContent value="decisions" className="space-y-3 mt-0">
          <div className="p-5 rounded-lg bg-card border border-border divide-y divide-border">
            {meeting.decisions && meeting.decisions.length > 0 ? (
              meeting.decisions.map((d, index) => (
                <div key={d.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{index + 1}.</span>
                      <span className="font-semibold text-xs text-foreground">
                        {d.topic || 'Decision'}
                      </span>
                    </div>
                    {(d.confidence !== undefined || d.confidenceScore !== undefined) && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {Math.round((d.confidence ?? d.confidenceScore ?? 1) * 100)}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/90 pl-5 font-medium leading-relaxed">{d.decision}</p>
                  {(d.context || d.rationale) && (
                    <p className="text-xs text-muted-foreground pl-5 leading-relaxed">
                      {d.context || d.rationale}
                    </p>
                  )}
                  {d.timestampStartMs !== undefined && (
                    <div className="text-[11px] text-muted-foreground font-mono pl-5 pt-1">
                      Citation: [{formatTime(d.timestampStartMs)}]{d.speakerName ? ` ${d.speakerName}` : ''}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-6 text-center italic">
                No decisions recorded.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Action Items */}
        <TabsContent value="actions" className="space-y-3 mt-0">
          <div className="p-5 rounded-lg bg-card border border-border divide-y divide-border">
            {meeting.actionItems && meeting.actionItems.length > 0 ? (
              meeting.actionItems.map((a) => (
                <div key={a.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded border border-border flex items-center justify-center shrink-0">
                        {a.status === 'COMPLETED' && <RiCheckLine className="w-3 h-3 text-primary" />}
                      </span>
                      <span className="font-medium text-xs text-foreground">{a.description || a.task}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-5.5">
                      <span>Assignee: {a.assigneeName || a.assignee?.name || 'Unassigned'}</span>
                      <span>•</span>
                      <span className="font-mono uppercase">{a.priority || 'MEDIUM'}</span>
                      {(a.deadline || a.dueDate) && (
                        <>
                          <span>•</span>
                          <span>Due: {new Date(a.deadline || a.dueDate!).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0 bg-muted border-border">
                    {a.status || 'PENDING'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-6 text-center italic">
                No action items recorded.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Risks */}
        <TabsContent value="risks" className="space-y-3 mt-0">
          <div className="p-5 rounded-lg bg-card border border-border divide-y divide-border">
            {meeting.risks && meeting.risks.length > 0 ? (
              meeting.risks.map((r) => (
                <div key={r.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <RiAlertLine className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.description || r.risk}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-muted border-border">
                      {r.severity}
                    </Badge>
                  </div>
                  {r.mitigation && (
                    <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                      <strong>Mitigation:</strong> {r.mitigation}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-6 text-center italic">
                No risks or blockers recorded.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 6: Open Questions */}
        <TabsContent value="questions" className="space-y-3 mt-0">
          <div className="p-5 rounded-lg bg-card border border-border divide-y divide-border">
            {meeting.openQuestions && meeting.openQuestions.length > 0 ? (
              meeting.openQuestions.map((q, idx) => (
                <div key={q.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{idx + 1}.</span>
                      <span className="font-medium text-xs text-foreground">{q.question}</span>
                    </div>
                    {(q.assignedTo || q.owner) && (
                      <p className="text-[11px] text-muted-foreground pl-5">
                        Assigned to {q.assignedTo || q.owner}
                      </p>
                    )}
                  </div>
                  {q.status && (
                    <Badge variant="outline" className="text-[10px] font-mono bg-muted border-border shrink-0">
                      {q.status}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-6 text-center italic">
                No open questions recorded.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 7: Full Transcript */}
        <TabsContent value="transcript" className="space-y-4 mt-0">
          <div className="rounded-xl bg-card border border-border shadow-xs relative">
            {/* Elevated Sticky Transcript Search Header */}
            <div className="sticky top-0 z-10 p-3.5 border-b border-border bg-card/95 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-xl">
              <div className="relative flex-1 max-w-md">
                <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Search transcript, keywords, or speakers..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-border bg-background outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground text-foreground"
                />
                {transcriptSearch && (
                  <button
                    type="button"
                    onClick={() => setTranscriptSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <RiCloseLine className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {transcriptSearch.trim() && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 animate-in fade-in-50">
                    {filteredSegments.length} match{filteredSegments.length === 1 ? '' : 'es'}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-2.5 py-1 rounded-md border border-border/60 shrink-0">
                  {filteredSegments.length} of {segments.length} segments
                </span>
              </div>
            </div>

            {/* Transcript Stream (Flows naturally with page scroll) */}
            <div className="p-4 sm:p-5 space-y-3 divide-y divide-border/50">
              {filteredSegments.length > 0 ? (
                filteredSegments.map((seg) => {
                  const isCopied = copiedSegId === seg.id;
                  return (
                    <div
                      key={seg.id}
                      className="pt-3 first:pt-0 group text-xs space-y-1 hover:bg-muted/10 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
                            [{formatTime(seg.startTimeMs)}]
                          </span>
                          <span className="font-semibold text-foreground">
                            {highlightMatches(seg.speakerName, transcriptSearch)}
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySegment(seg)}
                          className="h-5 text-[10px] px-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Copy line"
                        >
                          {isCopied ? (
                            <span className="text-primary flex items-center gap-1 font-medium">
                              <RiCheckLine className="w-3 h-3" /> Copied
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <RiFileCopyLine className="w-3 h-3" /> Copy
                            </span>
                          )}
                        </Button>
                      </div>
                      <p className="text-foreground/90 leading-relaxed pl-1 whitespace-pre-wrap font-sans text-xs">
                        {highlightMatches(seg.text, transcriptSearch)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
                    <RiSearch2Line className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">
                      {segments.length === 0
                        ? 'No transcript segments available.'
                        : `No segments matching "${transcriptSearch}"`}
                    </p>
                    {transcriptSearch && (
                      <p className="text-[11px] text-muted-foreground">
                        Try searching with different keywords or speaker names.
                      </p>
                    )}
                  </div>
                  {transcriptSearch && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTranscriptSearch('')}
                      className="h-7 text-xs px-3"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
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
