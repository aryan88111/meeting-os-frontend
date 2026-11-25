import React from 'react';
import { RiCalendarLine, RiTimeLine, RiDatabase2Line, RiCpuLine } from 'react-icons/ri';
import { Reveal } from './Reveal';

const FEATURES = [
  {
    icon: RiCalendarLine,
    title: 'Joins every meeting',
    description: 'A 4-tier fallback tries the Graph API, then teamsForBusiness, then a calendar invite, then a direct room — so personal Microsoft accounts never break the flow.'
  },
  {
    icon: RiTimeLine,
    title: 'Separates every speaker',
    description: 'Raw audio is chunked and mapped to individual speakers in under 140ms per segment, with exact timestamps down to the millisecond.'
  },
  {
    icon: RiDatabase2Line,
    title: 'Remembers everything',
    description: 'Every transcript is embedded natively in PostgreSQL with pgvector — no third-party vector database, no extra hop, sub-100ms search.'
  },
  {
    icon: RiCpuLine,
    title: 'Never blocks you',
    description: 'Summarization runs on background workers, so the app responds in milliseconds while the heavy AI work happens asynchronously.'
  }
];

export const FeatureBentoSection: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-28 max-w-6xl mx-auto px-5 sm:px-8 border-t border-border">

      <Reveal>
        <div className="max-w-xl mb-16">
          <div className="text-[12px] uppercase tracking-wide text-foreground/40 mb-3">What it does</div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight">
            Built to disappear into the way your team already meets.
          </h2>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Reveal key={feature.title} delayMs={idx * 90}>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-foreground/70" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-foreground/55 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};
