import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  RiSparklingFill, 
  RiTimeLine, 
  RiShareForwardLine, 
  RiFilePdfLine, 
  RiFileWordLine, 
  RiArrowLeftLine, 
  RiCheckLine, 
  RiAlertLine 
} from 'react-icons/ri';
import { Link } from 'react-router-dom';

export const IntelligenceViewer: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link to="/meetings">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <RiArrowLeftLine className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Q3 Product Architecture & Sprint Kickoff
              </h1>
              <Badge variant="success" className="text-[10px] py-0">Completed</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ingested Sep 5, 2026 • 48 mins duration • Source: Google Meet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RiShareForwardLine className="h-3.5 w-3.5 mr-1.5" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RiFileWordLine className="h-3.5 w-3.5 mr-1.5" />
            Export DOCX
          </Button>
          <Button variant="default" size="sm" className="h-8 text-xs">
            <RiFilePdfLine className="h-3.5 w-3.5 mr-1.5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Structured Intelligence Tabs */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="bg-muted/50 p-1 border border-border">
          <TabsTrigger value="overview" className="text-xs">Executive Summary</TabsTrigger>
          <TabsTrigger value="decisions" className="text-xs">Decisions (4)</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">Action Items (7)</TabsTrigger>
          <TabsTrigger value="risks" className="text-xs">Risks & Blockers (2)</TabsTrigger>
          <TabsTrigger value="transcript" className="text-xs">Full Transcript</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          <Card className="shadow-xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <RiSparklingFill className="h-4 w-4" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-sm text-foreground/90 leading-relaxed space-y-3">
              <p>
                The team agreed to transition the MeetingOS core engine into an event-driven architecture using <strong>RabbitMQ</strong> and <strong>Python FastAPI</strong> workers to ensure non-blocking scalability. All unstructured files (transcripts, PDFs, DOCX) will be stored in <strong>Cloudflare R2</strong> with signed short-lived download tokens.
              </p>
              <p>
                The MVP launch will prioritize manual transcript uploads (VTT, TXT, JSON) before connecting enterprise Google Meet and Microsoft Teams OAuth integrations in Phase 2.
              </p>
            </CardContent>
          </Card>

          {/* Quick Decision & Action highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Key Decisions</span>
                  <Badge variant="secondary" className="text-[10px]">4 Verified</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2.5">
                <div className="p-2.5 rounded-lg border border-border bg-card text-xs">
                  <p className="font-medium text-foreground">Adopt pgvector on PostgreSQL for organizational RAG</p>
                  <span className="text-[10px] text-muted-foreground block mt-1">Grounded at 00:14:22 - 00:15:10</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Action Items</span>
                  <Badge variant="warning" className="text-[10px]">3 In Progress</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2.5">
                <div className="p-2.5 rounded-lg border border-border bg-card text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">Configure RabbitMQ retry & DLQ exchange</p>
                    <span className="text-[10px] font-semibold text-primary">Aryan</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-1">Due: Sep 12, 2026</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Decisions */}
        <TabsContent value="decisions" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="p-3.5 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">1. Decoupled AI Pipeline</span>
                  <Badge variant="success" className="text-[10px]">Confidence: 98%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Isolate all LLM extraction and Playwright PDF exports into a dedicated Python worker service rather than running inside the NestJS BFF.
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                  <RiTimeLine className="h-3 w-3" />
                  <span>Timestamp Citation: 00:08:45 - 00:09:30 • Speaker: Aryan Gautam</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Action Items */}
        <TabsContent value="actions" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="p-3.5 rounded-lg border border-border bg-card flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border border-border flex items-center justify-center text-[10px]">
                      <RiCheckLine className="h-2.5 w-2.5 text-primary" />
                    </span>
                    <span className="font-semibold text-xs text-foreground">Implement Hey API client generation pipeline</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 ml-6">
                    Assignee: <strong>Aryan Gautam</strong> • Priority: <strong>HIGH</strong> • Deadline: <strong>Sep 10, 2026</strong>
                  </p>
                </div>
                <Badge variant="info" className="text-[10px]">In Progress</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Risks */}
        <TabsContent value="risks" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5 text-destructive">
                    <RiAlertLine className="h-3.5 w-3.5" />
                    Google Workspace Meet Transcript API Scopes
                  </span>
                  <Badge variant="destructive" className="text-[10px]">Medium Severity</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Tenant admin controls on Google Workspace accounts may block direct OAuth transcript retrieval without admin consent.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Transcript */}
        <TabsContent value="transcript" className="space-y-3 mt-0">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3 font-mono text-xs text-muted-foreground divide-y divide-border">
              <div className="pt-2">
                <span className="font-bold text-foreground">[00:00:15] Aryan Gautam:</span>
                <p className="mt-0.5 text-foreground/80">Welcome everyone to the MeetingOS architecture sync. Today we will finalize the tech stack.</p>
              </div>
              <div className="pt-2">
                <span className="font-bold text-foreground">[00:01:20] Sarah Chen:</span>
                <p className="mt-0.5 text-foreground/80">I reviewed the PRD and agree that separating the Python AI worker via RabbitMQ is the most resilient approach.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
