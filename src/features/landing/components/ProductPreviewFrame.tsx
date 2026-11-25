import React, { useState } from 'react';
import {
  RiCheckLine,
  RiFileCopyLine,
  RiPlayFill,
  RiPauseFill
} from 'react-icons/ri';

const WAVEFORM_HEIGHTS = [30, 50, 65, 35, 70, 55, 25, 65, 80, 45, 30, 75, 60, 40, 65, 45, 30, 55, 70, 50, 40, 60, 35, 70, 25, 55, 45, 30];

const SPEAKERS = [
  {
    id: '04:15',
    initials: 'SC',
    name: 'Sarah Chen',
    role: 'VP Eng',
    quote: 'Let’s eliminate the external vector DB and standardize on native PostgreSQL with pgvector for all embeddings.'
  },
  {
    id: '08:42',
    initials: 'AR',
    name: 'Alex Rivera',
    role: 'Architect',
    quote: 'I have the Teams fallback ready. If Graph API rejects a personal account, we route straight to a direct meeting room.'
  },
  {
    id: '14:20',
    initials: 'ER',
    name: 'Elena Rostova',
    role: 'DevOps',
    quote: 'The async worker consumers will be in staging by Friday afternoon, with retry on failure.'
  }
];

export const ProductPreviewFrame: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTimestamp, setActiveTimestamp] = useState<string>('08:42');
  const [copiedActionId, setCopiedActionId] = useState<number | null>(null);
  const [completedTasks, setCompletedTasks] = useState<{ [key: number]: boolean }>({ 1: true });

  const toggleTask = (id: number) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyActionText = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedActionId(id);
    setTimeout(() => setCopiedActionId(null), 2000);
  };

  return (
    <div id="product" className="max-w-4xl mx-auto rounded-2xl border border-border bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] overflow-hidden text-left">

      {/* Header strip */}
      <div className="px-5 sm:px-7 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-foreground/40">Live meeting</div>
          <div className="text-sm font-medium text-foreground truncate">Q3 Architecture &amp; pgvector Migration Sync</div>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-foreground/50 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          Recording
        </span>
      </div>

      {/* Audio Scrubber */}
      <div className="px-5 sm:px-7 py-3.5 border-b border-border flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-8 w-8 rounded-full bg-foreground hover:bg-foreground/85 text-background flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label={isPlaying ? 'Pause audio timeline simulation' : 'Play audio timeline simulation'}
        >
          {isPlaying ? <RiPauseFill className="h-4 w-4" /> : <RiPlayFill className="h-4 w-4 ml-0.5" />}
        </button>

        <div className="flex-1 flex items-center gap-1 h-6" role="group" aria-label="Audio waveform timeline scrubber">
          {WAVEFORM_HEIGHTS.map((height, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveTimestamp(`0${Math.floor(i / 3)}:${(i * 2).toString().padStart(2, '0')}`)}
              aria-label={`Jump to timestamp ${Math.floor(i / 3)}:${(i * 2).toString().padStart(2, '0')}`}
              style={{ height: `${height}%` }}
              className={`flex-1 rounded-full cursor-pointer transition-colors ${
                i <= 14 ? 'bg-foreground/70' : 'bg-foreground/15 hover:bg-foreground/30'
              }`}
            />
          ))}
        </div>

        <div className="text-xs text-foreground/50 tabular-nums shrink-0">
          {activeTimestamp} <span className="text-foreground/30">/ 42:15</span>
        </div>
      </div>

      {/* Main Grid: Transcript + Extraction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

        {/* Transcript */}
        <div className="p-5 sm:p-7 space-y-4">
          <div className="text-[11px] uppercase tracking-wide text-foreground/40">Transcript</div>
          {SPEAKERS.map((speaker) => (
            <button
              type="button"
              key={speaker.id}
              onClick={() => setActiveTimestamp(speaker.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeTimestamp === speaker.id
                  ? 'border-foreground/25 bg-secondary/60'
                  : 'border-transparent hover:bg-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-foreground/10 text-foreground/70 text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {speaker.initials}
                  </span>
                  <span className="text-sm font-medium text-foreground">{speaker.name}</span>
                  <span className="text-xs text-foreground/40">{speaker.role}</span>
                </div>
                <span className="text-xs text-foreground/40 tabular-nums shrink-0">{speaker.id}</span>
              </div>
              <p className="font-serif italic text-[15px] text-foreground/75 leading-snug">
                &ldquo;{speaker.quote}&rdquo;
              </p>
            </button>
          ))}
        </div>

        {/* Extraction */}
        <div className="p-5 sm:p-7 space-y-5 bg-secondary/20">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-foreground/40 mb-2">What MeetingOS extracted</div>
            <p className="font-serif text-[17px] leading-snug text-foreground">
              Engineering finalized PostgreSQL with pgvector for search, resolved the Teams token fallback, and confirmed Friday&apos;s worker deployment.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
            <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Decision recorded &middot; 04:15
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Approved replacing Pinecone with PostgreSQL pgvector, saving $14,200/quarter.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-foreground/40">Action items</div>

            <div className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleTask(1)}
                  aria-label={completedTasks[1] ? 'Mark task incomplete' : 'Mark task complete'}
                  className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    completedTasks[1] ? 'bg-foreground border-foreground text-background' : 'border-foreground/25'
                  }`}
                >
                  {completedTasks[1] && <RiCheckLine className="h-2.5 w-2.5" />}
                </button>
                <span className={`text-xs truncate ${completedTasks[1] ? 'line-through text-foreground/35' : 'text-foreground/80'}`}>
                  Deploy async worker consumers to staging
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-foreground/40">Elena</span>
                <button
                  type="button"
                  onClick={() => copyActionText(1, 'Deploy async worker consumers to staging (Assignee: Elena)')}
                  className="text-foreground/40 hover:text-foreground p-1 transition-colors cursor-pointer"
                  aria-label="Copy task text"
                >
                  {copiedActionId === 1 ? <RiCheckLine className="h-3.5 w-3.5" /> : <RiFileCopyLine className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleTask(2)}
                  aria-label={completedTasks[2] ? 'Mark task incomplete' : 'Mark task complete'}
                  className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    completedTasks[2] ? 'bg-foreground border-foreground text-background' : 'border-foreground/25'
                  }`}
                >
                  {completedTasks[2] && <RiCheckLine className="h-2.5 w-2.5" />}
                </button>
                <span className={`text-xs truncate ${completedTasks[2] ? 'line-through text-foreground/35' : 'text-foreground/80'}`}>
                  Verify Microsoft Graph personal-account fallback
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-foreground/40">Alex</span>
                <button
                  type="button"
                  onClick={() => copyActionText(2, 'Verify Microsoft Graph personal-account fallback (Assignee: Alex)')}
                  className="text-foreground/40 hover:text-foreground p-1 transition-colors cursor-pointer"
                  aria-label="Copy task text"
                >
                  {copiedActionId === 2 ? <RiCheckLine className="h-3.5 w-3.5" /> : <RiFileCopyLine className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
