import React, { useState } from 'react';
import { RiSearch2Line, RiSparklingFill } from 'react-icons/ri';
import { Reveal } from './Reveal';

const ragQueries = [
  {
    query: 'Why did we choose pgvector instead of Pinecone?',
    answer: 'Sarah Chen and Alex Rivera agreed during the Q3 Architecture Sync to consolidate storage into PostgreSQL with pgvector. This removed the external vector database, cutting quarterly infrastructure cost by $14,200 while holding sub-80ms query latency.',
    citations: [
      { speaker: 'Sarah Chen · VP Eng', timestamp: '04:15' },
      { speaker: 'Alex Rivera · Architect', timestamp: '08:42' }
    ]
  },
  {
    query: 'What was the plan for the Teams OAuth token fix?',
    answer: 'Alex Rivera built a 4-tier fallback: try Graph API onlineMeetings, fall back to a teamsForBusiness event, then a calendar invite, then a direct MeetingOS room with one-click attendee email copying.',
    citations: [
      { speaker: 'Alex Rivera · Architect', timestamp: '11:30' },
      { speaker: 'Elena Rostova · DevOps', timestamp: '14:20' }
    ]
  },
  {
    query: 'What deadline did we set for the async worker rollout?',
    answer: 'Elena Rostova committed to deploying the async worker consumers, with automated retry on failure, before Friday at 5:00 PM EST.',
    citations: [
      { speaker: 'Elena Rostova · DevOps', timestamp: '14:20' }
    ]
  }
];

export const CommandPaletteSection: React.FC = () => {
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const activeQuery = ragQueries[activeQueryIndex];

  return (
    <section id="ask" className="py-20 sm:py-28 bg-secondary/30 border-y border-border">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">

        <Reveal>
          <div className="max-w-xl mb-12">
            <div className="text-[12px] uppercase tracking-wide text-foreground/40 mb-3">Ask MeetingOS</div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight">
              Every past meeting, one plain-language question away.
            </h2>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="rounded-2xl border border-border bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">

            {/* Search Input Bar */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center gap-3">
              <RiSearch2Line className="h-4 w-4 text-foreground/40 shrink-0" />
              <div className="flex-1 text-sm text-foreground truncate">
                {activeQuery.query}
              </div>
            </div>

            {/* Query Selector Tabs */}
            <div className="p-3 sm:p-4 border-b border-border flex flex-wrap gap-2" role="tablist" aria-label="Example knowledge base queries">
              {ragQueries.map((item, idx) => (
                <button
                  key={item.query}
                  type="button"
                  role="tab"
                  aria-selected={activeQueryIndex === idx}
                  onClick={() => setActiveQueryIndex(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeQueryIndex === idx
                      ? 'bg-foreground text-background font-medium'
                      : 'bg-secondary text-foreground/60 hover:text-foreground'
                  }`}
                >
                  Question {idx + 1}
                </button>
              ))}
            </div>

            {/* Answer */}
            <div key={activeQueryIndex} className="p-5 sm:p-7 space-y-5 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="flex items-start gap-2.5">
                <RiSparklingFill className="h-4 w-4 text-primary shrink-0 mt-1" />
                <p className="font-serif text-[17px] leading-snug text-foreground">
                  {activeQuery.answer}
                </p>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-foreground/40">Sourced from</div>
                <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                  {activeQuery.citations.map((cite) => (
                    <div key={`${cite.speaker}-${cite.timestamp}`} className="text-xs text-foreground/60">
                      <span className="text-foreground/80 font-medium">{cite.speaker}</span>
                      <span className="text-foreground/35"> · {cite.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </Reveal>

      </div>
    </section>
  );
};
