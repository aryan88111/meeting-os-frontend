import React, { useState, useEffect, useCallback } from 'react';
import { 
  RiCalendarEventLine, 
  RiArrowLeftSLine, 
  RiArrowRightSLine, 
  RiCheckboxCircleLine, 
  RiCheckboxBlankCircleLine,
  RiTimeLine, 
  RiSparklingFill, 
  RiAddLine,
  RiVideoChatLine,
  RiFlagLine,
  RiUser3Line,
  RiExternalLinkLine,
  RiRefreshLine,
  RiDeleteBin6Line,
  RiFileCopyLine,
  RiCheckLine,
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { SiZoom } from 'react-icons/si';
import { RiTeamLine } from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ScheduleMeetingModal } from '@/features/meetings/components/ScheduleMeetingModal';
import { DeleteMeetingModal } from '@/features/meetings/components/DeleteMeetingModal';
import {
  meetingsControllerListMeetings,
  integrationsControllerSyncGoogleCalendar,
  integrationsControllerPushMeetingToGoogleCalendar,
} from '@/api';

interface MeetingEvent {
  id: string;
  title: string;
  provider?: string;
  meetingUrl?: string;
  startTime?: string;
  endTime?: string;
  durationSeconds?: number;
  status: string;
  actionsCount?: number;
  createdAt?: string;
  participants: Array<{ name: string; email?: string }>;
}

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [meetings, setMeetings] = useState<MeetingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [pushingMeetingId, setPushingMeetingId] = useState<string | null>(null);
  const [syncStatusNote, setSyncStatusNote] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingEvent | null>(null);
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

  const handleCopyUrl = (id: string, url?: string) => {
    if (!url) return;
    copyToClipboard(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAttendeeEmails = (m: MeetingEvent, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const emails = (m.participants || [])
      .filter((p) => p.email && p.email.trim())
      .map((p) => p.email!.trim());
    if (emails.length === 0) return;
    copyToClipboard(emails.join(', '));
    setCopiedEmailMeetingId(m.id);
    setTimeout(() => setCopiedEmailMeetingId(null), 2000);
  };

  const fetchMeetings = useCallback(async () => {
    try {
      const response = await meetingsControllerListMeetings({
        query: { limit: 100 },
      });
      if (response.data) {
        const data = response.data as any;
        setMeetings(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSyncGoogle = async () => {
    setIsSyncingGoogle(true);
    setSyncStatusNote(null);
    try {
      const res = await integrationsControllerSyncGoogleCalendar();
      if (res.data) {
        const data = res.data as any;
        setSyncStatusNote(`✓ Synced ${data.syncedCount || 0} events from your Google Calendar`);
        await fetchMeetings();
      } else if (res.error) {
        const errData = res.error as any;
        setSyncStatusNote(`Sync note: ${errData?.message || 'Google account not connected or session expired'}`);
      }
    } catch (err: any) {
      setSyncStatusNote(`Sync note: ${err?.message || 'Google Calendar connection unavailable'}`);
    } finally {
      setIsSyncingGoogle(false);
      setTimeout(() => setSyncStatusNote(null), 5000);
    }
  };

  const handlePushToGoogle = async (meetingId: string) => {
    setPushingMeetingId(meetingId);
    setSyncStatusNote(null);
    try {
      const res = await integrationsControllerPushMeetingToGoogleCalendar({
        path: { meetingId },
      });
      if (res.data) {
        const data = res.data as any;
        setSyncStatusNote(`✓ Successfully pushed meeting to Google Calendar!`);
        await fetchMeetings();
        if (data.googleEventLink) {
          window.open(data.googleEventLink, '_blank');
        }
      } else if (res.error) {
        const errData = res.error as any;
        setSyncStatusNote(`Could not push to Google: ${errData?.message || 'Check Google connection in Integrations'}`);
      }
    } catch (err: any) {
      setSyncStatusNote(`Could not push to Google: ${err?.message || 'Check Google connection in Integrations'}`);
    } finally {
      setPushingMeetingId(null);
      setTimeout(() => setSyncStatusNote(null), 6000);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMeetingLocalDateStr = (timeStr?: string): string | null => {
    if (!timeStr) return null;
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const selectedDayMeetings = meetings.filter((m) => {
    const meetingDate = getMeetingLocalDateStr(m.startTime || m.createdAt);
    return meetingDate === selectedDateStr;
  });

  const renderProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'GOOGLE_MEET':
        return <FcGoogle className="w-3.5 h-3.5" />;
      case 'ZOOM':
        return <SiZoom className="w-3.5 h-3.5 text-blue-500" />;
      case 'MICROSOFT_TEAMS':
        return <RiTeamLine className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <RiVideoChatLine className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RiCalendarEventLine className="w-5 h-5 text-primary" /> Calendar & Meeting Schedule
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View scheduled sessions, launch Google Meet calls, and manage action items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncGoogle}
            disabled={isSyncingGoogle}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <RiRefreshLine className={`h-3.5 w-3.5 ${isSyncingGoogle ? 'animate-spin text-primary' : ''}`} />
            <span>{isSyncingGoogle ? 'Syncing...' : 'Sync Google Calendar'}</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsScheduleOpen(true)}
            className="h-8 text-xs shadow-xs"
          >
            <RiAddLine className="h-3.5 w-3.5 mr-1.5" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {syncStatusNote && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FcGoogle className="w-4 h-4 flex-shrink-0" />
            <span>{syncStatusNote}</span>
          </div>
          <Link to="/integrations" className="text-primary font-semibold hover:underline text-[11px] whitespace-nowrap">
            Manage Integrations →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground">
                {monthNames[month]} {year}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                  <RiArrowLeftSLine className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => {
                    const now = new Date();
                    setCurrentDate(now);
                    setSelectedDay(now.getDate());
                  }}
                >
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                  <RiArrowRightSLine className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <span key={d} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-1">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-16 rounded-lg bg-muted/10 border border-transparent" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = meetings.filter((m) => {
                    const meetingDate = getMeetingLocalDateStr(m.startTime || m.createdAt);
                    return meetingDate === dateStr;
                  });
                  const isSelected = selectedDay === day;
                  const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'h-16 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all relative group',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                          : 'border-border/60 bg-card hover:bg-muted/40 hover:border-border',
                        isToday && !isSelected && 'border-primary/50'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            'text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center leading-none',
                            isToday
                              ? 'bg-primary text-primary-foreground font-bold'
                              : isSelected
                              ? 'text-primary font-bold'
                              : 'text-foreground'
                          )}
                        >
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>

                      {dayEvents.length > 0 && (
                        <div className="space-y-0.5 w-full overflow-hidden">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className="text-[9px] truncate px-1 py-0.5 rounded bg-muted/80 text-foreground font-medium flex items-center gap-1"
                            >
                              <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                              <span className="truncate">{ev.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[8px] text-muted-foreground pl-1 font-semibold">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Selected Day's Meetings & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-xs flex flex-col h-full">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border bg-muted/20">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <RiCalendarEventLine className="w-4 h-4 text-primary" />
                  {monthNames[month]} {selectedDay}, {year}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedDayMeetings.length} meeting(s) scheduled
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsScheduleOpen(true)}
                className="h-7 text-xs px-2.5 shadow-2xs"
              >
                <RiAddLine className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {selectedDayMeetings.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <RiVideoChatLine className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">No meetings scheduled for this date.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsScheduleOpen(true)}
                    className="h-7 text-xs mt-2"
                  >
                    Schedule a Meeting
                  </Button>
                </div>
              ) : (
                selectedDayMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-border bg-card/60 hover:bg-muted/30 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {renderProviderIcon(m.provider)}
                        <Link
                          to={`/meetings/${m.id}`}
                          className="font-bold text-xs text-foreground hover:text-primary transition hover:underline"
                        >
                          {m.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[9px]">
                          {m.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMeetingToDelete(m)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete meeting"
                        >
                          <RiDeleteBin6Line className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <RiTimeLine className="w-3 h-3" />
                        {m.startTime
                          ? new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'TBD'}
                      </span>

                      {m.participants && m.participants.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span
                            className="flex items-center gap-1 cursor-default"
                            title={m.participants.map((p) => (p.email ? `${p.name} (${p.email})` : p.name)).join(', ')}
                          >
                            <RiUser3Line className="w-3 h-3" />
                            {m.participants.length} attendee(s)
                          </span>
                          {m.participants.some((p) => p.email) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleCopyAttendeeEmails(m, e)}
                              className="h-5 px-1 text-[9px] text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copy attendee email(s)"
                            >
                              {copiedEmailMeetingId === m.id ? (
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
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {m.meetingUrl && (
                        <>
                          <a
                            href={m.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition"
                          >
                            Join Video Call <RiExternalLinkLine className="w-3 h-3" />
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyUrl(m.id, m.meetingUrl)}
                            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                            title="Copy meeting link"
                          >
                            {copiedId === m.id ? (
                              <>
                                <RiCheckLine className="w-3 h-3 mr-1 text-emerald-500" />
                                <span className="text-emerald-500 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <RiFileCopyLine className="w-3 h-3 mr-1" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>
                        </>
                      )}

                      {m.provider !== 'GOOGLE_MEET' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pushingMeetingId === m.id}
                          onClick={() => handlePushToGoogle(m.id)}
                          className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 border-primary/20 flex items-center gap-1"
                          title="Push this meeting to Google Calendar & generate a real Google Meet room"
                        >
                          <FcGoogle className="w-3 h-3" />
                          <span>{pushingMeetingId === m.id ? 'Pushing...' : 'Push to Google'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        initialDate={selectedDateStr}
        onClose={() => setIsScheduleOpen(false)}
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
