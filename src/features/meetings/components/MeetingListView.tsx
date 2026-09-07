import React, { useEffect, useState, useCallback } from 'react';
import { 
  RiAddLine, 
  RiFilter3Line, 
  RiSearch2Line, 
  RiVideoChatLine, 
  RiFileTextLine, 
  RiUploadCloud2Line,
  RiExternalLinkLine,
  RiTimeLine,
  RiGroupLine,
  RiSparklingFill,
  RiLoader4Line,
  RiDeleteBin6Line,
  RiFileCopyLine,
  RiCheckLine,
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { SiZoom } from 'react-icons/si';
import { RiTeamLine } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { UploadTranscriptModal } from '@/features/transcripts/components/UploadTranscriptModal';
import { DeleteMeetingModal } from './DeleteMeetingModal';
import { meetingsControllerListMeetings } from '@/api';

interface MeetingItem {
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
  hasSummary?: boolean;
  participants: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
}

export const MeetingListView: React.FC = () => {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEmailMeetingId, setCopiedEmailMeetingId] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Clipboard API error:', err);
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

  const handleCopyMeetingUrl = (id: string, url?: string) => {
    if (!url) return;
    copyToClipboard(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAttendeeEmails = (meeting: MeetingItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const emails = meeting.participants
      .filter((p) => p.email && p.email.trim())
      .map((p) => p.email!.trim());
    if (emails.length === 0) return;
    copyToClipboard(emails.join(', '));
    setCopiedEmailMeetingId(meeting.id);
    setTimeout(() => setCopiedEmailMeetingId(null), 2000);
  };

  const fetchMeetings = useCallback(async () => {
    try {
      const response = await meetingsControllerListMeetings({
        query: {
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(statusFilter !== 'ALL' ? { status: statusFilter as any } : {}),
        },
      });
      if (response.data) {
        const data = response.data as any;
        setMeetings(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const renderProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'GOOGLE_MEET':
        return <FcGoogle className="w-4 h-4" title="Google Meet" />;
      case 'ZOOM':
        return <SiZoom className="w-4 h-4 text-blue-500" title="Zoom" />;
      case 'MICROSOFT_TEAMS':
        return <RiTeamLine className="w-4 h-4 text-purple-500" title="Microsoft Teams" />;
      default:
        return <RiVideoChatLine className="w-4 h-4 text-muted-foreground" title="Meeting" />;
    }
  };

  const formatMeetingDate = (startTime?: string) => {
    if (!startTime) return 'Not scheduled';
    const d = new Date(startTime);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.round(seconds / 60);
    return `${mins}m`;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
            Ready
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
            Scheduled
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            All Meeting Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synchronized records from Google Meet, Zoom, Teams, and uploaded transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="h-8 text-xs cursor-pointer"
          >
            <RiUploadCloud2Line className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Upload Transcript
          </Button>
          <Link to="/integrations">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <FcGoogle className="h-3.5 w-3.5 mr-1.5" />
              Calendar Sync
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsScheduleOpen(true)}
            className="h-8 text-xs shadow-xs cursor-pointer"
          >
            <RiAddLine className="h-3.5 w-3.5 mr-1.5" />
            New Meeting
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, attendee, or keyword..."
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="CREATED">Scheduled</option>
          <option value="COMPLETED">Processed</option>
          <option value="PROCESSING">In Progress</option>
        </select>
      </div>

      {/* Meetings List */}
      <Card className="p-0 overflow-hidden shadow-xs border-border">
        <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <div>Meeting Title & Details</div>
          <div className="flex items-center gap-8 pr-4">
            <span className="hidden md:inline">Intelligence</span>
            <span>Status</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center gap-2 text-muted-foreground">
            <RiLoader4Line className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Loading meetings...</span>
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <RiVideoChatLine className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">No meetings found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Schedule a new meeting or connect your Google Calendar to automatically import your upcoming Google Meet sessions.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Button size="sm" onClick={() => setIsScheduleOpen(true)} className="h-8 text-xs">
                <RiAddLine className="w-3.5 h-3.5 mr-1" /> Schedule Meeting
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                {/* Left info */}
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    {renderProviderIcon(meeting.provider)}
                    <Link
                      to={`/meetings/${meeting.id}`}
                      className="font-semibold text-xs sm:text-sm text-foreground hover:text-primary transition-colors hover:underline"
                    >
                      {meeting.title}
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <RiTimeLine className="w-3.5 h-3.5" />
                      {formatMeetingDate(meeting.startTime)}
                    </span>
                    {meeting.durationSeconds && (
                      <span>({formatDuration(meeting.durationSeconds)})</span>
                    )}

                    {meeting.participants.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span
                          className="flex items-center gap-1 cursor-default"
                          title={meeting.participants.map((p) => (p.email ? `${p.name} (${p.email})` : p.name)).join(', ')}
                        >
                          <RiGroupLine className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {meeting.participants
                              .map((p) => (p.email ? `${p.name} (${p.email})` : p.name))
                              .slice(0, 2)
                              .join(', ')}
                            {meeting.participants.length > 2 && ` +${meeting.participants.length - 2} more`}
                          </span>
                        </span>
                        {meeting.participants.some((p) => p.email) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleCopyAttendeeEmails(meeting, e)}
                            className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copy attendee email(s)"
                          >
                            {copiedEmailMeetingId === meeting.id ? (
                              <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                                <RiCheckLine className="w-3 h-3" /> Copied
                              </span>
                            ) : (
                              <RiFileCopyLine className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {meeting.meetingUrl && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={meeting.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                        >
                          Join Call <RiExternalLinkLine className="w-3 h-3" />
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMeetingUrl(meeting.id, meeting.meetingUrl)}
                          className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground"
                          title="Copy meeting link"
                        >
                          {copiedId === meeting.id ? (
                            <RiCheckLine className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <RiFileCopyLine className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right badges & actions */}
                <div className="flex items-center gap-4 sm:pr-2">
                  <div className="hidden md:flex items-center gap-2 text-xs">
                    {meeting.decisionsCount !== undefined && meeting.decisionsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground font-mono">
                        {meeting.decisionsCount} Decisions
                      </span>
                    )}
                    {meeting.actionsCount !== undefined && meeting.actionsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground font-mono">
                        {meeting.actionsCount} Actions
                      </span>
                    )}
                  </div>

                  <div>{renderStatusBadge(meeting.status)}</div>

                  <Link to={`/meetings/${meeting.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      View
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMeetingToDelete(meeting)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete meeting"
                  >
                    <RiDeleteBin6Line className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={fetchMeetings}
      />

      {/* Upload Transcript Modal */}
      <UploadTranscriptModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchMeetings}
      />

      {/* Delete Meeting Modal */}
      <DeleteMeetingModal
        isOpen={Boolean(meetingToDelete)}
        meetingId={meetingToDelete?.id || null}
        meetingTitle={meetingToDelete?.title || ''}
        provider={meetingToDelete?.provider}
        onClose={() => setMeetingToDelete(null)}
        onDeleted={fetchMeetings}
      />
    </div>
  );
};
