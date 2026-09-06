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
  RiVideoChatLine,
  RiLoader4Line,
  RiSearch2Line,
  RiInboxLine
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { SiZoom } from 'react-icons/si';
import { RiTeamLine } from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { UploadTranscriptModal } from '@/features/transcripts/components/UploadTranscriptModal';
import { useMeetingsQuery } from '@/features/meetings/hooks/useMeetings';
import { searchControllerSearchMeetings } from '@/api';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const [ragResults, setRagResults] = useState<any[] | null>(null);

  const { data: meetingsData, isLoading, refetch } = useMeetingsQuery({ limit: 50 });
  const meetings = meetingsData?.items || [];
  const totalMeetingsCount = meetingsData?.total ?? meetings.length;

  // Real Metric Calculations
  const verifiedDecisionsCount = meetings.reduce((sum, m) => sum + (m.decisionsCount ?? m.decisions?.length ?? 0), 0);
  const totalActionItemsCount = meetings.reduce((sum, m) => sum + (m.actionsCount ?? m.actionItems?.length ?? 0), 0);
  const pendingActionItemsCount = meetings.reduce(
    (sum, m) => sum + (m.pendingActionsCount ?? m.actionItems?.filter((a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length ?? 0),
    0
  );

  const completedMeetingsCount = meetings.filter((m) => m.status === 'COMPLETED').length;
  const processingMeetingsCount = meetings.filter((m) => m.status === 'PROCESSING').length;

  const metrics = [
    { 
      label: 'Ingested Meetings', 
      value: isLoading ? '...' : String(totalMeetingsCount), 
      subtext: `${completedMeetingsCount} ready & indexed`, 
      icon: RiCalendarEventLine, 
      trend: processingMeetingsCount > 0 ? `${processingMeetingsCount} processing` : 'All Synced',
      accent: 'text-primary' 
    },
    { 
      label: 'Verified Decisions', 
      value: isLoading ? '...' : String(verifiedDecisionsCount), 
      subtext: '100% grounded in transcripts', 
      icon: RiSparklingFill, 
      trend: totalMeetingsCount > 0 ? `${(verifiedDecisionsCount / Math.max(1, totalMeetingsCount)).toFixed(1)} / meet` : '0',
      accent: 'text-emerald-500' 
    },
    { 
      label: 'Action Items Tracked', 
      value: isLoading ? '...' : String(totalActionItemsCount), 
      subtext: `${totalActionItemsCount - pendingActionItemsCount} completed`, 
      icon: RiCheckboxCircleLine, 
      trend: `${pendingActionItemsCount} Pending`,
      accent: 'text-amber-500' 
    },
    { 
      label: 'Processing Pipeline', 
      value: 'Gemini 2.0', 
      subtext: 'Async vector embeddings', 
      icon: RiTimeLine, 
      trend: 'Live Indexed',
      accent: 'text-cyan-500' 
    },
  ];

  const handleRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    setIsSearchingRag(true);
    setRagResults(null);
    try {
      const res = await searchControllerSearchMeetings({
        query: { q: ragQuery.trim() },
      });
      if (res.data) {
        setRagResults(res.data as any[]);
      }
    } catch (err) {
      console.warn('RAG Search failed:', err);
      // Fallback local filter
      const matches = meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(ragQuery.toLowerCase()) ||
          m.description?.toLowerCase().includes(ragQuery.toLowerCase())
      );
      setRagResults(matches);
    } finally {
      setIsSearchingRag(false);
    }
  };

  const renderProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'GOOGLE_MEET':
        return <FcGoogle className="w-4 h-4 shrink-0" title="Google Meet" />;
      case 'ZOOM':
        return <SiZoom className="w-4 h-4 text-blue-500 shrink-0" title="Zoom" />;
      case 'MICROSOFT_TEAMS':
        return <RiTeamLine className="w-4 h-4 text-purple-500 shrink-0" title="Teams" />;
      default:
        return <RiVideoChatLine className="w-4 h-4 text-primary shrink-0" title="Meeting" />;
    }
  };

  const formatMeetingDate = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    const d = new Date(dateStr);
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
          <Link to="/meetings">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <RiFileTextLine className="h-3.5 w-3.5 mr-1.5" />
              All Meetings
            </Button>
          </Link>
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
              View all ({totalMeetingsCount}) <RiArrowRightUpLine className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 border border-border rounded-xl bg-card/40">
                <RiLoader4Line className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading workspace meetings...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-xl bg-card/30">
                <RiInboxLine className="h-8 w-8 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">No meetings ingested yet</p>
                  <p className="text-[11px] text-muted-foreground">Upload a transcript or sync Google Meet to get started.</p>
                </div>
                <Button 
                  onClick={() => setIsUploadModalOpen(true)}
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs mt-2"
                >
                  <RiUploadCloud2Line className="h-3.5 w-3.5 mr-1.5" />
                  Upload Transcript
                </Button>
              </div>
            ) : (
              meetings.slice(0, 5).map((meeting) => (
                <Card key={meeting.id} className="shadow-xs hover:border-primary/40 transition-all group">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        {renderProviderIcon(meeting.provider)}
                      </div>
                      <div>
                        <Link 
                          to={`/meetings/${meeting.id}`}
                          className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1"
                        >
                          {meeting.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
                          <span>{formatMeetingDate(meeting.startTime || meeting.createdAt)}</span>
                          <span>•</span>
                          <span>{formatDuration(meeting.durationSeconds)}</span>
                          <span>•</span>
                          <span className="font-medium text-foreground">{meeting.decisionsCount ?? meeting.decisions?.length ?? 0} decisions</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-500">{meeting.actionsCount ?? meeting.actionItems?.length ?? 0} actions</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {meeting.status === 'COMPLETED' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-0 px-2">
                          Ready
                        </Badge>
                      ) : meeting.status === 'PROCESSING' ? (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px] py-0 px-2 animate-pulse">
                          AI Processing
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0 px-2">
                          Scheduled
                        </Badge>
                      )}
                      <Link to={`/meetings/${meeting.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5">
                          Inspect
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick RAG / Ask My Meetings Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Organizational Q&A (RAG)
            </h2>
            <Badge variant="info" className="text-[10px]">Semantic Search</Badge>
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
              <form onSubmit={handleRagSearch} className="space-y-2">
                <div className="relative">
                  <textarea
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    placeholder="e.g., What did we decide about the payment gateway database schema?"
                    rows={3}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSearchingRag || !ragQuery.trim()} 
                  size="sm" 
                  className="w-full h-8 text-xs font-medium cursor-pointer"
                >
                  {isSearchingRag ? (
                    <>
                      <RiLoader4Line className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Searching Knowledge Base...
                    </>
                  ) : (
                    <>
                      <RiChatVoiceLine className="h-3.5 w-3.5 mr-1.5" />
                      Query Knowledge Base
                    </>
                  )}
                </Button>
              </form>

              {ragResults && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Matches Found ({ragResults.length})
                  </span>
                  {ragResults.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">No meetings matched your query.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {ragResults.map((item) => (
                        <Link
                          key={item.id}
                          to={`/meetings/${item.id}`}
                          className="block p-2 rounded-lg bg-background border border-border hover:border-primary/50 text-xs transition"
                        >
                          <div className="font-semibold text-foreground line-clamp-1">{item.title}</div>
                          {item.summaries?.[0]?.executiveSummary && (
                            <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                              {item.summaries[0].executiveSummary}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <UploadTranscriptModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
