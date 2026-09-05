import React, { useState, useEffect, useRef } from 'react';
import {
  RiCloseLine,
  RiUploadCloud2Line,
  RiFileTextLine,
  RiFileCodeLine,
  RiCheckLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiSparklingFill,
  RiCalendarEventLine,
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import {
  meetingsControllerListMeetings,
  transcriptsControllerUploadAndCreate,
  transcriptsControllerUploadTranscript,
} from '@/api';

interface UploadTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedMeetingId?: string;
}

interface MeetingOption {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export const UploadTranscriptModal: React.FC<UploadTranscriptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedMeetingId,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'NEW_MEETING' | 'EXISTING_MEETING'>(
    preselectedMeetingId ? 'EXISTING_MEETING' : 'NEW_MEETING',
  );
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState(
    preselectedMeetingId || '',
  );
  const [meetings, setMeetings] = useState<MeetingOption[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch user meetings if in existing mode
  useEffect(() => {
    if (isOpen) {
      meetingsControllerListMeetings({
        query: { limit: 50 },
      })
        .then((res) => {
          if (res.data) {
            const data = res.data as any;
            const items = data.items || [];
            setMeetings(items);
            if (!selectedMeetingId && items.length > 0) {
              setSelectedMeetingId(items[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    // Auto populate meeting title from filename
    if (!meetingTitle) {
      const cleanName = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setMeetingTitle(cleanName);
    }

    // Read content
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setFileContent(text);
      const lines = text.split(/\r?\n/).slice(0, 8).join('\n');
      setFilePreview(lines);
    };
    reader.onerror = () => {
      setError('Failed to read file contents');
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent.trim()) {
      setError('Please select or drop a valid transcript file (.txt, .json, .vtt, .srt)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (mode === 'NEW_MEETING') {
        const response = await transcriptsControllerUploadAndCreate({
          body: {
            title: meetingTitle || file?.name || 'Uploaded Meeting',
            content: fileContent,
            filename: file?.name,
            mimeType: file?.type,
          },
        });

        if (response.error) {
          const errData = response.error as any;
          throw new Error(errData?.message || 'Failed to upload and create meeting');
        }

        const data = response.data as any;
        setSuccessMsg('Transcript uploaded! AI extraction queued.');
        setTimeout(() => {
          setIsUploading(false);
          onSuccess?.();
          onClose();
          if (data?.meeting?.id) {
            navigate(`/meetings/${data.meeting.id}`);
          }
        }, 1200);
      } else {
        if (!selectedMeetingId) {
          throw new Error('Please select a meeting to attach the transcript to.');
        }

        const response = await transcriptsControllerUploadTranscript({
          path: { id: selectedMeetingId },
          body: {
            content: fileContent,
            filename: file?.name,
            mimeType: file?.type,
          },
        });

        if (response.error) {
          const errData = response.error as any;
          throw new Error(errData?.message || 'Failed to upload transcript to meeting');
        }

        setSuccessMsg('Transcript attached! AI extraction queued.');
        setTimeout(() => {
          setIsUploading(false);
          onSuccess?.();
          onClose();
          navigate(`/meetings/${selectedMeetingId}`);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading transcript');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <RiUploadCloud2Line className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground leading-none">
                Ingest Meeting Transcript
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Upload .txt, .json, .vtt, or .srt to trigger the automated AI extraction pipeline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              <RiErrorWarningLine className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <RiCheckLine className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode Switch */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setMode('NEW_MEETING')}
              className={`py-1.5 text-xs font-medium rounded-lg transition ${
                mode === 'NEW_MEETING'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create New Meeting
            </button>
            <button
              type="button"
              onClick={() => setMode('EXISTING_MEETING')}
              className={`py-1.5 text-xs font-medium rounded-lg transition ${
                mode === 'EXISTING_MEETING'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Attach to Existing Meeting
            </button>
          </div>

          {/* New Meeting Title or Select Existing */}
          {mode === 'NEW_MEETING' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Meeting Title
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 Architecture & Sprint Kickoff"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Select Scheduled Meeting
              </label>
              {meetings.length > 0 ? (
                <select
                  value={selectedMeetingId}
                  onChange={(e) => setSelectedMeetingId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.status})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 text-xs text-muted-foreground bg-muted/30 border border-dashed rounded-xl flex items-center gap-2">
                  <RiCalendarEventLine className="w-4 h-4" />
                  <span>No scheduled meetings found. Switch to &apos;Create New Meeting&apos;.</span>
                </div>
              )}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-primary bg-primary/5'
                : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-border/80 hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept=".txt,.json,.vtt,.srt"
              className="hidden"
            />
            {file ? (
              <>
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                  <RiFileCodeLine className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB &bull; Ready to ingest
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-muted text-muted-foreground">
                  <RiUploadCloud2Line className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Click to browse or drag &amp; drop transcript
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Supports .txt, .json, .vtt, and .srt formats
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Content Preview */}
          {filePreview && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span className="flex items-center gap-1 font-medium">
                  <RiFileTextLine className="w-3.5 h-3.5" />
                  Content Preview (First 8 lines)
                </span>
                <span>{fileContent.split('\n').length} total lines</span>
              </div>
              <pre className="p-3 text-[11px] font-mono bg-muted/40 border border-border/60 rounded-xl overflow-x-auto max-h-32 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {filePreview}
              </pre>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl border border-border hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !fileContent}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-xs disabled:opacity-50 transition"
            >
              {isUploading ? (
                <>
                  <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <RiSparklingFill className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ingest &amp; Extract Intelligence</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
