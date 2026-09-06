import React, { useState } from 'react';
import { 
  RiFileTextLine, 
  RiFilePdfLine, 
  RiFileWordLine, 
  RiMarkdownLine, 
  RiDownload2Line, 
  RiSearch2Line, 
  RiCalendarEventLine, 
  RiTimeLine, 
  RiArrowRightUpLine, 
  RiSparklingFill,
  RiLoader4Line,
  RiInboxLine,
  RiCheckboxCircleLine
} from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useMeetingsQuery } from '@/features/meetings/hooks/useMeetings';
import { documentsControllerExportDocument } from '@/api';

export const DocumentsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState<{ id: string; format: string } | null>(null);

  const { data: meetingsData, isLoading } = useMeetingsQuery({ limit: 100 });
  const meetings = meetingsData?.items || [];

  const handleExport = async (meetingId: string, format: 'docx' | 'pdf' | 'markdown', meetingTitle: string) => {
    setDownloadingFormat({ id: meetingId, format });
    try {
      const response = await documentsControllerExportDocument({
        path: { id: meetingId },
        query: { format },
      });

      if (response.data) {
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data as any]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'docx' ? 'docx' : format === 'pdf' ? 'pdf' : 'md';
        const cleanTitle = meetingTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        a.download = `${cleanTitle}-intelligence-report.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RiFileTextLine className="h-5 w-5 text-primary" />
            Exported Reports &amp; Meeting Documents
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download generated 100% full-width Word (.docx), PDF, and Markdown meeting digests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs py-1 px-3">
            {meetings.length} Documents Available
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meeting documents..."
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 border border-border rounded-xl bg-card">
          <RiLoader4Line className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading meeting documents...</span>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-xl bg-card">
          <RiInboxLine className="h-8 w-8 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">No documents found matching your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeetings.map((meeting) => {
            const isWordLoading = downloadingFormat?.id === meeting.id && downloadingFormat.format === 'docx';
            const isPdfLoading = downloadingFormat?.id === meeting.id && downloadingFormat.format === 'pdf';
            const isMdLoading = downloadingFormat?.id === meeting.id && downloadingFormat.format === 'markdown';

            return (
              <Card key={meeting.id} className="border-border shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                        <RiFileTextLine className="h-4 w-4" />
                      </div>
                      <div>
                        <Link 
                          to={`/meetings/${meeting.id}`}
                          className="font-bold text-sm text-foreground hover:text-primary transition hover:underline line-clamp-1"
                        >
                          {meeting.title}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">
                          {meeting.startTime
                            ? new Date(meeting.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[10px] font-mono bg-muted border-border">
                      {meeting.status}
                    </Badge>
                  </div>

                  {/* Summary / Stats Preview */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                    <span className="font-medium text-foreground">
                      {meeting.decisionsCount ?? meeting.decisions?.length ?? 0} decisions
                    </span>
                    <span>•</span>
                    <span className="font-medium text-emerald-500">
                      {meeting.actionsCount ?? meeting.actionItems?.length ?? 0} actions
                    </span>
                    <span>•</span>
                    <span>{meeting.participants?.length || 0} attendees</span>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(meeting.id, 'docx', meeting.title)}
                    disabled={Boolean(downloadingFormat)}
                    className="h-8 text-xs gap-1.5 flex-1"
                  >
                    {isWordLoading ? (
                      <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RiFileWordLine className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    <span>Word (.docx)</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(meeting.id, 'pdf', meeting.title)}
                    disabled={Boolean(downloadingFormat)}
                    className="h-8 text-xs gap-1.5 flex-1"
                  >
                    {isPdfLoading ? (
                      <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RiFilePdfLine className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span>PDF</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(meeting.id, 'markdown', meeting.title)}
                    disabled={Boolean(downloadingFormat)}
                    className="h-8 text-xs gap-1.5"
                    title="Download Markdown"
                  >
                    {isMdLoading ? (
                      <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RiMarkdownLine className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>

                  <Link to={`/meetings/${meeting.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs px-2" title="Inspect">
                      <RiArrowRightUpLine className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
