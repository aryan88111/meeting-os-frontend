import React, { useState } from 'react';
import { 
  RiCheckboxCircleLine, 
  RiCheckboxBlankCircleLine, 
  RiSearch2Line, 
  RiSparklingFill, 
  RiTimeLine, 
  RiUser3Line, 
  RiArrowRightUpLine, 
  RiCheckDoubleLine,
  RiLoader4Line,
  RiInboxLine
} from 'react-icons/ri';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useMeetingsQuery } from '@/features/meetings/hooks/useMeetings';

interface FlatActionItem {
  id: string;
  title: string;
  meetingId: string;
  meetingTitle: string;
  assignee: string;
  deadline?: string;
  priority: string;
  status: string;
  citation?: string;
}

export const ActionItemsView: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, string>>({});

  const { data: meetingsData, isLoading } = useMeetingsQuery({ limit: 100 });
  const meetings = meetingsData?.items || [];

  // Flatten action items across all meetings
  const allItems: FlatActionItem[] = [];
  meetings.forEach((m) => {
    (m.actionItems as any[])?.forEach((a) => {
      let citation = '';
      if (a.sourceSegment) {
        const startSec = a.sourceSegment.startTimeMs ? Math.floor(Number(a.sourceSegment.startTimeMs) / 1000) : 0;
        const mins = Math.floor(startSec / 60);
        const secs = startSec % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        citation = `[${timeStr}] ${a.sourceSegment.speakerName || 'Speaker'}`;
      }

      allItems.push({
        id: a.id,
        title: a.description || a.task || 'Action task',
        meetingId: m.id,
        meetingTitle: m.title,
        assignee: a.assignee?.name || a.assigneeName || 'Unassigned',
        deadline: a.deadline ? new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
        priority: a.priority || 'MEDIUM',
        status: localStatusOverrides[a.id] || a.status || 'PENDING',
        citation,
      });
    });
  });

  const toggleComplete = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setLocalStatusOverrides((prev) => ({
      ...prev,
      [id]: nextStatus,
    }));
  };

  const filteredItems = allItems.filter((item) => {
    const isCompleted = item.status === 'COMPLETED';
    const isPending = item.status === 'PENDING';
    const isInProgress = item.status === 'IN_PROGRESS';

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && isPending) ||
      (filterStatus === 'in_progress' && isInProgress) ||
      (filterStatus === 'completed' && isCompleted);

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive" className="text-[10px] py-0 font-mono">URGENT</Badge>;
      case 'HIGH':
        return <Badge variant="warning" className="text-[10px] py-0 font-mono">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="info" className="text-[10px] py-0 font-mono">MEDIUM</Badge>;
      case 'LOW':
      default:
        return <Badge variant="secondary" className="text-[10px] py-0 font-mono">LOW</Badge>;
    }
  };

  const pendingCount = allItems.filter((i) => i.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RiCheckDoubleLine className="h-5 w-5 text-primary" />
            Action Items &amp; Task Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every task is automatically grounded with speaker timestamps from meeting transcripts.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs py-1 px-3">
          {pendingCount} Pending Tasks
        </Badge>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50 p-1 border border-border">
            <TabsTrigger value="all" className="text-xs">All Tasks ({allItems.length})</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tasks by name, assignee, or meeting..."
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Action Items List */}
      <Card className="p-0 overflow-hidden shadow-xs border-border">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <RiLoader4Line className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading action items across meetings...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <RiInboxLine className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">No action items found</p>
              <p className="text-[11px] text-muted-foreground">
                {allItems.length === 0 
                  ? 'No action items extracted yet. Ingest a meeting transcript to extract tasks.' 
                  : 'No tasks match your current filters.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredItems.map((item) => {
              const isDone = item.status === 'COMPLETED';
              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors',
                    isDone ? 'bg-muted/15 opacity-65' : 'hover:bg-muted/30 bg-card'
                  )}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleComplete(item.id, item.status)}
                      className="mt-0.5 text-primary hover:scale-110 transition-transform shrink-0 cursor-pointer"
                      title={isDone ? 'Mark pending' : 'Mark completed'}
                    >
                      {isDone ? (
                        <RiCheckboxCircleLine className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <RiCheckboxBlankCircleLine className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold text-xs text-foreground leading-snug',
                            isDone && 'line-through text-muted-foreground'
                          )}
                        >
                          {item.title}
                        </span>
                        {getPriorityBadge(item.priority)}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <RiUser3Line className="h-3 w-3 text-muted-foreground" />
                          {item.assignee}
                        </span>
                        {item.deadline && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <RiTimeLine className="h-3 w-3" />
                              Due: <strong>{item.deadline}</strong>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <Link
                          to={`/meetings/${item.meetingId}`}
                          className="text-primary hover:underline line-clamp-1"
                        >
                          {item.meetingTitle}
                        </Link>
                      </div>

                      {item.citation && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                          <RiSparklingFill className="h-3 w-3 text-primary shrink-0" />
                          <span>Source Citation: {item.citation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <Link to={`/meetings/${item.meetingId}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                        View Meeting
                        <RiArrowRightUpLine className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
