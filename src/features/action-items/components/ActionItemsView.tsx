import React, { useState } from 'react';
import { 
  RiCheckboxCircleLine, 
  RiCheckboxBlankCircleLine, 
  RiFilter3Line, 
  RiSearch2Line, 
  RiSparklingFill, 
  RiTimeLine, 
  RiUser3Line, 
  RiArrowRightUpLine, 
  RiCheckDoubleLine 
} from 'react-icons/ri';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ActionItem {
  id: string;
  title: string;
  meetingId: string;
  meetingTitle: string;
  assignee: string;
  deadline: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  citation: string;
}

export const ActionItemsView: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [items, setItems] = useState<ActionItem[]>([
    {
      id: 'a1',
      title: 'Configure RabbitMQ retry exchange & DLQ dead-letter queue',
      meetingId: '1',
      meetingTitle: 'Q3 Product Architecture & Sprint Kickoff',
      assignee: 'Aryan Gautam',
      deadline: 'Sep 12, 2026',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      citation: '00:14:20 - 00:15:02 (Speaker: Aryan)',
    },
    {
      id: 'a2',
      title: 'Implement Hey API client generation pipeline in React SPA',
      meetingId: '1',
      meetingTitle: 'Q3 Product Architecture & Sprint Kickoff',
      assignee: 'Aryan Gautam',
      deadline: 'Sep 10, 2026',
      priority: 'HIGH',
      status: 'COMPLETED',
      citation: '00:22:15 - 00:23:00 (Speaker: Aryan)',
    },
    {
      id: 'a3',
      title: 'Validate Google Meet OAuth refresh token lifecycle and tenant scopes',
      meetingId: '3',
      meetingTitle: 'Enterprise Customer Success Review',
      assignee: 'David K.',
      deadline: 'Sep 14, 2026',
      priority: 'HIGH',
      status: 'PENDING',
      citation: '00:44:00 - 00:45:12 (Speaker: David K.)',
    },
    {
      id: 'a4',
      title: 'Design multi-tenant organization switching modal and RBAC guards',
      meetingId: '1',
      meetingTitle: 'Q3 Product Architecture & Sprint Kickoff',
      assignee: 'Sarah Chen',
      deadline: 'Sep 15, 2026',
      priority: 'MEDIUM',
      status: 'PENDING',
      citation: '00:31:10 - 00:31:45 (Speaker: Sarah Chen)',
    },
    {
      id: 'a5',
      title: 'Audit pgvector distance metrics and benchmark HNSW vs IVFFlat index',
      meetingId: '2',
      meetingTitle: 'Engineering Backend Sync — Database Indexing',
      assignee: 'Aryan Gautam',
      deadline: 'Sep 18, 2026',
      priority: 'LOW',
      status: 'PENDING',
      citation: '00:18:30 - 00:19:10 (Speaker: Aryan)',
    },
  ]);

  const toggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
            }
          : item
      )
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && item.status === 'PENDING') ||
      (filterStatus === 'in_progress' && item.status === 'IN_PROGRESS') ||
      (filterStatus === 'completed' && item.status === 'COMPLETED');

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getPriorityBadge = (priority: ActionItem['priority']) => {
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
            <RiCheckDoubleLine className="h-5 w-5 text-primary" />
            Action Items & Task Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every task is automatically grounded with speaker timestamps from meeting transcripts.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs py-1 px-3">
          {items.filter((i) => i.status !== 'COMPLETED').length} Pending Tasks
        </Badge>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50 p-1 border border-border">
            <TabsTrigger value="all" className="text-xs">All Tasks ({items.length})</TabsTrigger>
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
        <div className="divide-y divide-border">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No action items found matching your filters.
            </div>
          ) : (
            filteredItems.map((item) => {
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
                      onClick={() => toggleComplete(item.id)}
                      className="mt-0.5 text-primary hover:scale-110 transition-transform shrink-0"
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
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <RiTimeLine className="h-3 w-3" />
                          Due: <strong>{item.deadline}</strong>
                        </span>
                        <span>•</span>
                        <Link
                          to={`/meetings/${item.meetingId}`}
                          className="text-primary hover:underline line-clamp-1"
                        >
                          {item.meetingTitle}
                        </Link>
                      </div>

                      <div className="pt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <RiSparklingFill className="h-3 w-3 text-primary shrink-0" />
                        <span>Source Citation: {item.citation}</span>
                      </div>
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
            })
          )}
        </div>
      </Card>
    </div>
  );
};
