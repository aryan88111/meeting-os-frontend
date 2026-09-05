import React, { useState } from 'react';
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
  RiUser3Line
} from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface TodoItem {
  id: string;
  title: string;
  meetingId: string;
  meetingTitle: string;
  date: string; // YYYY-MM-DD
  time?: string;
  assignee: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
  completed: boolean;
  citationTimestamp?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  provider: 'GOOGLE_MEET' | 'MICROSOFT_TEAMS' | 'ZOOM' | 'MANUAL';
  actionsCount: number;
}

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 5)); // Sep 2026
  const [selectedDay, setSelectedDay] = useState<number>(5);

  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: 't1',
      title: 'Configure RabbitMQ retry exchange & DLQ dead-letter queue',
      meetingId: '1',
      meetingTitle: 'Q3 Product Architecture Sync',
      date: '2026-09-05',
      time: '04:00 PM',
      assignee: 'Aryan Gautam',
      priority: 'URGENT',
      completed: false,
      citationTimestamp: '00:14:20 - 00:15:02',
    },
    {
      id: 't2',
      title: 'Verify pgvector cosine similarity indexes on Supabase',
      meetingId: '2',
      meetingTitle: 'Engineering Backend Sync',
      date: '2026-09-05',
      time: '05:30 PM',
      assignee: 'Aryan Gautam',
      priority: 'HIGH',
      completed: true,
      citationTimestamp: '00:22:15 - 00:23:00',
    },
    {
      id: 't3',
      title: 'Design multi-tenant organization switching modal',
      meetingId: '1',
      meetingTitle: 'Q3 Product Architecture Sync',
      date: '2026-09-08',
      time: '02:00 PM',
      assignee: 'Sarah Chen',
      priority: 'MEDIUM',
      completed: false,
      citationTimestamp: '00:31:10 - 00:31:45',
    },
    {
      id: 't4',
      title: 'Validate Google Meet OAuth refresh token lifecycle',
      meetingId: '3',
      meetingTitle: 'Enterprise Customer Success Review',
      date: '2026-09-12',
      time: '11:00 AM',
      assignee: 'David K.',
      priority: 'HIGH',
      completed: false,
      citationTimestamp: '00:44:00 - 00:45:12',
    },
  ]);

  const scheduledEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Q3 Product Architecture & Sprint Kickoff',
      date: '2026-09-05',
      time: '02:30 PM',
      duration: '48 mins',
      provider: 'GOOGLE_MEET',
      actionsCount: 7,
    },
    {
      id: '2',
      title: 'Engineering Backend Sync — Database Indexing',
      date: '2026-09-05',
      time: '11:00 AM',
      duration: '32 mins',
      provider: 'MANUAL',
      actionsCount: 5,
    },
    {
      id: '3',
      title: 'Customer Success & Feedback Review',
      date: '2026-09-08',
      time: '03:00 PM',
      duration: '45 mins',
      provider: 'MICROSOFT_TEAMS',
      actionsCount: 4,
    },
  ];

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const daysInMonth = 30; // Sep has 30 days
  const startDayOffset = 2; // Sep 1, 2026 starts on Tuesday (offset 2 for Sun=0, Mon=1)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDateStr = `2026-09-${String(selectedDay).padStart(2, '0')}`;
  const dayTodos = todos.filter((t) => t.date === selectedDateStr);
  const dayEvents = scheduledEvents.filter((e) => e.date === selectedDateStr);

  const getPriorityBadge = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive" className="text-[10px] py-0">URGENT</Badge>;
      case 'HIGH':
        return <Badge variant="warning" className="text-[10px] py-0">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="info" className="text-[10px] py-0">MEDIUM</Badge>;
      case 'LOW':
        return <Badge variant="secondary" className="text-[10px] py-0">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RiCalendarEventLine className="h-5 w-5 text-primary" />
            Meeting & Task Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Action items and meeting schedules extracted directly from transcript commitments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Today
          </Button>
          <Button variant="default" size="sm" className="h-8 text-xs">
            <RiAddLine className="h-3.5 w-3.5 mr-1.5" />
            Add To-Do Item
          </Button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Day Tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monthly Calendar (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 shadow-xs">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                September 2026
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <RiArrowLeftSLine className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <RiArrowRightSLine className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysOfWeek.map((d) => (
                <span key={d} className="text-[11px] font-semibold text-muted-foreground py-1">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty offset padding */}
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 rounded-md p-1 bg-muted/10 opacity-30" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `2026-09-${String(dayNum).padStart(2, '0')}`;
                const hasTodos = todos.some((t) => t.date === dateStr && !t.completed);
                const hasMeetings = scheduledEvents.some((e) => e.date === dateStr);
                const isSelected = selectedDay === dayNum;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDay(dayNum)}
                    className={cn(
                      'h-16 rounded-lg p-1.5 text-left flex flex-col justify-between transition-all border',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                        : 'border-border/60 hover:border-border hover:bg-muted/40 bg-card'
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center',
                        isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground'
                      )}
                    >
                      {dayNum}
                    </span>

                    {/* Task Indicators */}
                    <div className="flex items-center gap-1 mt-auto">
                      {hasMeetings && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Meeting Scheduled" />
                      )}
                      {hasTodos && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Pending Action Item" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Selected Date Schedule & Action Items (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Schedule & Tasks — Sep {selectedDay}, 2026
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {dayTodos.length} Tasks • {dayEvents.length} Meetings
            </Badge>
          </div>

          {/* Day Meetings Section */}
          {dayEvents.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Meetings on this day
              </span>
              {dayEvents.map((evt) => (
                <Card key={evt.id} className="p-3.5 shadow-xs border-primary/30 bg-primary/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                        <RiVideoChatLine className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          to={`/meetings/${evt.id}`}
                          className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {evt.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <RiTimeLine className="h-3 w-3" /> {evt.time} ({evt.duration})
                          </span>
                          <span>•</span>
                          <span className="text-primary font-medium">{evt.actionsCount} extracted items</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Action Items To-Do List */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Action Items & Deadlines
            </span>

            {dayTodos.length === 0 ? (
              <Card className="p-6 text-center shadow-xs border-dashed">
                <RiCheckboxCircleLine className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">No tasks due on this date</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Select another day or extract tasks from a transcript.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {dayTodos.map((todo) => (
                  <Card 
                    key={todo.id} 
                    className={cn(
                      'p-3.5 shadow-xs transition-all border',
                      todo.completed ? 'opacity-60 bg-muted/20 border-border/50' : 'bg-card border-border hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo.id)}
                        className="mt-0.5 text-primary hover:scale-110 transition-transform shrink-0"
                      >
                        {todo.completed ? (
                          <RiCheckboxCircleLine className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <RiCheckboxBlankCircleLine className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-xs font-medium text-foreground leading-snug',
                              todo.completed && 'line-through text-muted-foreground'
                            )}
                          >
                            {todo.title}
                          </span>
                          {getPriorityBadge(todo.priority)}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <RiUser3Line className="h-3 w-3 text-muted-foreground" />
                            {todo.assignee}
                          </span>
                          <span>•</span>
                          <Link
                            to={`/meetings/${todo.meetingId}`}
                            className="text-primary hover:underline line-clamp-1"
                          >
                            {todo.meetingTitle}
                          </Link>
                        </div>

                        {todo.citationTimestamp && (
                          <div className="mt-2 pt-1.5 border-t border-border/50 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <RiSparklingFill className="h-3 w-3 text-primary" />
                            <span>Transcript Grounding: {todo.citationTimestamp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
