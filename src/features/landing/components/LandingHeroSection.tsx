import React from 'react';
import { Link } from 'react-router-dom';
import { RiArrowRightLine, RiArrowRightUpLine, RiGoogleFill, RiMicrosoftFill } from 'react-icons/ri';
import { SiZoom } from 'react-icons/si';
import { ProductPreviewFrame } from './ProductPreviewFrame';
import { Reveal } from './Reveal';

export const LandingHeroSection: React.FC = () => {
  return (
    <section className="pt-20 pb-16 sm:pt-28 sm:pb-24 px-5 sm:px-8 max-w-6xl mx-auto text-center">

      <Reveal>
        <div className="inline-flex items-center gap-2 text-[12px] tracking-wide uppercase text-foreground/50 mb-8">
          <span className="h-px w-6 bg-foreground/30" />
          AI meeting intelligence
          <span className="h-px w-6 bg-foreground/30" />
        </div>
      </Reveal>

      {/* Editorial Headline */}
      <Reveal delayMs={80}>
        <h1 className="font-serif text-[2.75rem] leading-[1.08] sm:text-6xl lg:text-[5.25rem] lg:leading-[1.04] tracking-tight text-foreground max-w-4xl mx-auto mb-7">
          The meeting is over.{' '}
          <span className="italic text-primary">The work</span> is already organized.
        </h1>
      </Reveal>

      {/* Subtitle */}
      <Reveal delayMs={140}>
        <p className="text-base sm:text-lg text-foreground/55 max-w-xl mx-auto mb-10 leading-relaxed">
          MeetingOS captures Google Meet &amp; Teams calls, separates every speaker in seconds, and turns each conversation into decisions, action items, and a searchable knowledge base.
        </p>
      </Reveal>

      {/* CTA Group */}
      <Reveal delayMs={200}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-foreground hover:bg-foreground/85 text-background font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Start for free</span>
            <RiArrowRightLine className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <a
            href="#ask"
            className="text-sm font-medium text-foreground/70 hover:text-foreground border-b border-foreground/30 hover:border-foreground pb-0.5 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            See it answer a question
            <RiArrowRightUpLine className="h-3.5 w-3.5" />
          </a>
        </div>
      </Reveal>

      {/* Integrations Row */}
      <Reveal delayMs={260}>
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 mb-16 text-foreground/40">
          <span className="text-[11px] uppercase tracking-wide">Works with</span>
          <span className="flex items-center gap-1.5 text-sm text-foreground/60">
            <RiGoogleFill className="h-4 w-4" />
            Google Meet
          </span>
          <span className="flex items-center gap-1.5 text-sm text-foreground/60">
            <RiMicrosoftFill className="h-4 w-4" />
            Microsoft Teams
          </span>
          <span className="flex items-center gap-1.5 text-sm text-foreground/60">
            <SiZoom className="h-3.5 w-3.5" />
            Zoom
          </span>
        </div>
      </Reveal>

      {/* Key Metrics — a quiet inline line, not stat cards */}
      <Reveal delayMs={320}>
        <div className="flex items-center justify-center flex-wrap gap-x-10 gap-y-4 pt-8 border-t border-border max-w-2xl mx-auto mb-16">
          <div>
            <div className="font-serif text-2xl text-foreground">&lt;8.2s</div>
            <div className="text-xs text-foreground/45 mt-0.5">to summarize</div>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div>
            <div className="font-serif text-2xl text-foreground">99.4%</div>
            <div className="text-xs text-foreground/45 mt-0.5">speaker accuracy</div>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div>
            <div className="font-serif text-2xl text-foreground">100%</div>
            <div className="text-xs text-foreground/45 mt-0.5">searchable, forever</div>
          </div>
        </div>
      </Reveal>

      <Reveal delayMs={120}>
        <ProductPreviewFrame />
      </Reveal>

    </section>
  );
};
