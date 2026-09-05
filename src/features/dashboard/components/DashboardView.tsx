import React, { useState } from 'react';
import { 
  RiCalendarEventLine, 
  RiSparklingFill, 
  RiCheckboxCircleLine, 
  RiTimeLine, 
  RiArrowRightUpLine, 
  RiUploadCloud2Line, 
  RiFileTextLine, 
  RiBrainLine, 
  RiChatVoiceLine, 
  RiVideoChatLine 
} from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UploadTranscriptModal } from '@/features/transcripts/components/UploadTranscriptModal';

export const DashboardView: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const metrics = [
    { 
      label: 'Total Ingested Meetings', 
      value: '24', 
      subtext: '+4 this week', 
      icon: RiCalendarEventLine, 
      trend: '+16%',
      accent: 'text-primary' 
    },
    { 
      label: 'Verified Decisions', 
      value: '58', 
      subtext: '100% grounded in transcript', 
      icon: RiSparklingFill, 
      trend: '+22%',
      accent: 'text-emerald-500' 
    },
    { 
      label: 'Action Items Tracked', 
      value: '87', 
      subtext: '92% completed on time', 
      icon: RiCheckboxCircleLine, 
      trend: '8 Pending',
      accent: 'text-amber-500' 
    },
    { 
      label: 'Avg Processing Latency', 
      value: '3.8s', 
      subtext: 'Gemini 2.0 async pipeline', 
      icon: RiTimeLine, 
      trend: '-18% faster',
      accent: 'text-cyan-500' 
    },
  ];

  const recentMeetings = [
    {
      id: '1',
      title: 'Q3 Product Architecture & Sprint Kickoff',
      date: 'Today, 2:30 PM',
      duration: '48m',
      decisionsCount: 4,
      actionsCount: 7,
      status: 'COMPLETED',
      provider: 'GOOGLE_MEET',
      participants: ['Aryan Gautam', 'Sarah Chen', 'Alex Rivera'],
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
      participants: ['Aryan Gautam', 'David K.'],
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
      participants: ['Aryan Gautam', 'Elena Rostova', 'Mark T.'],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Meeting Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Structured decision extraction, action tracking, and organizational knowledge base.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RiFileTextLine className="h-3.5 w-3.5 mr-1.5" />
            Executive Digest
          </Button>
          <Button 
            onClick={() => setIsUploadModalOpen(true)} 
            variant="default" 
            size="sm" 
            className="h-8 text-xs cursor-pointer shadow-xs"
          >
            <RiUploadCloud2Line className="h-3.5 w-3.5 mr-1.5" />
            Ingest Transcript
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="shadow-xs hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                  <div className={`p-1.5 rounded-md bg-secondary ${item.accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold tracking-tight text-foreground">{item.value}</span>
                    <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {item.trend}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block mt-1">{item.subtext}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Section: Recent Meetings & Quick RAG Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ingested Meetings List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Recent Ingested Meetings
            </h2>
            <Link 
              to="/meetings" 
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all <RiArrowRightUpLine className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentMeetings.map((meeting) => (
              <Card key={meeting.id} className="shadow-xs hover:border-primary/40 transition-all group">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <RiVideoChatLine className="h-4 w-4" />
                    </div>
                    <div>
                      <Link 
                        to={`/meetings/${meeting.id}`}
                        className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1"
                      >
                        {meeting.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
                        <span>{meeting.date}</span>
                        <span>•</span>
                        <span>{meeting.duration}</span>
                        <span>•</span>
                        <span className="font-medium text-foreground">{meeting.decisionsCount} decisions</span>
                        <span>•</span>
                        <span className="font-medium text-emerald-500">{meeting.actionsCount} actions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Badge variant="success" className="text-[10px] py-0 px-2">
                      Ready
                    </Badge>
                    <Link to={`/meetings/${meeting.id}`}>
                      <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5">
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quick RAG / Ask My Meetings Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Organizational Q&A (RAG)
            </h2>
            <Badge variant="info" className="text-[10px]">pgvector</Badge>
          </div>

          <Card className="border-primary/20 bg-primary/5 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground">
                <RiBrainLine className="h-4 w-4 text-primary" />
                Ask across all team discussions
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground mt-1">
                Query past decisions, ownerships, deadlines, or technical specs with exact transcript timestamp citations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <div className="relative">
                <textarea
                  placeholder="e.g., What did we decide about the payment gateway database schema?"
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <Button size="sm" className="w-full h-8 text-xs font-medium">
                <RiChatVoiceLine className="h-3.5 w-3.5 mr-1.5" />
                Query Knowledge Base
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <UploadTranscriptModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
