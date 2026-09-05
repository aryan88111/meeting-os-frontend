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
import { meetingsControllerListMeetings } from '@/api';

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
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = (id: string, url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    <div className="space-y-6 animate-in fade-in duration-300">
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
          <Link to="/integrations">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <FcGoogle className="h-3.5 w-3.5 mr-1.5" />
              Sync Calendar
            </Button>
          </Link>
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
                        'h-16 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all relative overflow-hidden group',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border/60 hover:border-primary/40 bg-card',
                        isToday && !isSelected && 'border-muted-foreground/40'
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs font-semibold h-5 w-5 rounded-full flex items-center justify-center',
                          isToday ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'
                        )}
                      >
                        {day}
                      </span>

                      <div className="space-y-0.5 w-full">
                        {dayEvents.slice(0, 2).map((evt) => (
                          <div
                            key={evt.id}
                            className="text-[9px] truncate px-1 py-0.5 rounded bg-secondary/80 text-foreground font-medium flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <span className="truncate">{evt.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[8px] text-muted-foreground pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Selected Day Schedule & Action Items (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Schedule for {monthNames[month]} {selectedDay}, {year}
                </CardTitle>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedDayMeetings.length} meeting session(s) scheduled
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleOpen(true)}
                className="h-7 text-xs"
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

                      {m.participants.length > 0 && (
                        <span className="flex items-center gap-1">
                          <RiUser3Line className="w-3 h-3" />
                          {m.participants.length} attendee(s)
                        </span>
                      )}
                    </div>

                    {m.meetingUrl && (
                      <div className="pt-1 flex items-center gap-2">
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
                      </div>
                    )}
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
