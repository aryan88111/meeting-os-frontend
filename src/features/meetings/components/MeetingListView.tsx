import React from 'react';
import { 
  RiAddLine, 
  RiFilter3Line, 
  RiSearch2Line, 
  RiVideoChatLine, 
  RiFileTextLine, 
  RiUploadCloud2Line 
} from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

export const MeetingListView: React.FC = () => {
  const meetings = [
    {
      id: '1',
      title: 'Q3 Product Architecture & Sprint Kickoff',
      date: 'Today, 2:30 PM',
      duration: '48m',
      decisionsCount: 4,
      actionsCount: 7,
      status: 'COMPLETED',
      provider: 'GOOGLE_MEET',
      participants: 'Aryan Gautam, Sarah Chen, Alex Rivera',
    },
    {
      id: '2',
      title: 'Engineering Backend Sync — Database Indexing & pgvector',
      date: 'Yesterday, 11:00 AM',
      duration: '32m',
      decisionsCount: 2,
      actionsCount: 5,
      status: 'COMPLETED',
      provider: 'MANUAL',
      participants: 'Aryan Gautam, David K.',
    },
    {
      id: '3',
      title: 'Enterprise Customer Success & Q3 Feedback Review',
      date: 'Sep 3, 4:00 PM',
      duration: '55m',
      decisionsCount: 3,
      actionsCount: 8,
      status: 'COMPLETED',
      provider: 'MICROSOFT_TEAMS',
      participants: 'Aryan Gautam, Elena Rostova, Mark T.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            All Meeting Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synchronized records from Google Meet, Teams, and uploaded transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RiUploadCloud2Line className="h-3.5 w-3.5 mr-1.5" />
            Upload File
          </Button>
          <Button variant="default" size="sm" className="h-8 text-xs">
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
            placeholder="Search by title, attendee, topic, or keyword..."
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9 text-xs">
          <RiFilter3Line className="h-3.5 w-3.5 mr-1.5" />
          Filter
        </Button>
      </div>

      {/* Table / List */}
      <Card className="p-0 overflow-hidden shadow-xs border-border">
        <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Meeting Title & Metadata</span>
          </div>
          <div className="flex items-center gap-8 pr-4">
            <span className="hidden md:inline">Intelligence</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                  <RiVideoChatLine className="h-4 w-4" />
                </div>
                <div>
                  <Link
                    to={`/meetings/${meeting.id}`}
                    className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
                  >
                    {meeting.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
                    <span>{meeting.date}</span>
                    <span>•</span>
                    <span>{meeting.duration}</span>
                    <span>•</span>
                    <span>{meeting.participants}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 self-end sm:self-center">
                <div className="hidden md:flex items-center gap-3 text-xs">
                  <span className="font-medium text-foreground">{meeting.decisionsCount} decisions</span>
                  <span className="font-medium text-emerald-500">{meeting.actionsCount} actions</span>
                </div>

                <Badge variant="success" className="text-[10px] py-0 px-2">
                  Completed
                </Badge>

                <Link to={`/meetings/${meeting.id}`}>
                  <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5">
                    <RiFileTextLine className="h-3 w-3 mr-1" />
                    Inspect
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
