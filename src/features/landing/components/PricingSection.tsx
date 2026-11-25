import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RiCheckLine } from 'react-icons/ri';
import { Reveal } from './Reveal';

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-20 sm:py-28 max-w-6xl mx-auto px-5 sm:px-8 border-t border-border">

      <Reveal>
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="text-[12px] uppercase tracking-wide text-foreground/40 mb-3">Pricing</div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight mb-7">
            Predictable plans. No hidden seat fees.
          </h2>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-secondary">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                !isAnnual ? 'bg-foreground text-background' : 'text-foreground/55 hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isAnnual ? 'bg-foreground text-background' : 'text-foreground/55 hover:text-foreground'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] font-semibold text-primary">Save 20%</span>
            </button>
          </div>
        </div>
      </Reveal>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">

        {/* Starter Plan */}
        <Reveal delayMs={0} className="h-full">
        <div className="h-full p-7 rounded-2xl border border-border flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wide text-foreground/40">Community</div>
            <div className="font-serif text-4xl text-foreground">
              $0 <span className="text-sm font-sans text-foreground/40">/ forever</span>
            </div>
            <p className="text-sm text-foreground/55 leading-relaxed">
              For small teams that want automated meeting transcripts.
            </p>
            <div className="pt-4 border-t border-border space-y-2.5 text-sm text-foreground/70">
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>10 meetings / month</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>Google Meet &amp; Teams sync</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>AI executive summaries</span>
              </div>
            </div>
          </div>

          <Link
            to="/register"
            className="w-full py-2.5 rounded-full border border-border hover:border-foreground text-foreground font-medium text-sm text-center transition-colors block cursor-pointer"
          >
            Start free
          </Link>
        </div>
        </Reveal>

        {/* Pro Team Plan (Highlighted) */}
        <Reveal delayMs={100} className="h-full">
        <div className="h-full p-7 rounded-2xl border-2 border-foreground relative flex flex-col justify-between space-y-6">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-foreground text-background text-[10px] font-medium uppercase tracking-wide">
            Recommended
          </div>

          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wide text-foreground/40">Pro Team</div>
            <div className="font-serif text-4xl text-foreground">
              {isAnnual ? '$24' : '$29'}{' '}
              <span className="text-sm font-sans text-foreground/40">/ user / mo</span>
            </div>
            <p className="text-sm text-foreground/55 leading-relaxed">
              Full automation, unlimited meetings, and pgvector search.
            </p>
            <div className="pt-4 border-t border-border space-y-2.5 text-sm text-foreground/70">
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span><strong className="font-medium">Unlimited</strong> meeting processing</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>Full knowledge base search</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>One-click attendee email dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>PDF &amp; Markdown exports</span>
              </div>
            </div>
          </div>

          <Link
            to="/register"
            className="w-full py-2.5 rounded-full bg-foreground hover:bg-foreground/85 text-background font-medium text-sm text-center transition-colors block cursor-pointer"
          >
            Get started
          </Link>
        </div>
        </Reveal>

        {/* Enterprise Plan */}
        <Reveal delayMs={200} className="h-full">
        <div className="h-full p-7 rounded-2xl border border-border flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wide text-foreground/40">Enterprise</div>
            <div className="font-serif text-4xl text-foreground">
              Custom
            </div>
            <p className="text-sm text-foreground/55 leading-relaxed">
              Dedicated PostgreSQL instances, SSO, and custom SLAs.
            </p>
            <div className="pt-4 border-t border-border space-y-2.5 text-sm text-foreground/70">
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>Dedicated tenant isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>SAML / Okta SSO</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-foreground/40" />
                <span>99.99% uptime SLA</span>
              </div>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full py-2.5 rounded-full border border-border hover:border-foreground text-foreground font-medium text-sm text-center transition-colors block cursor-pointer"
          >
            Talk to sales
          </Link>
        </div>
        </Reveal>

      </div>
    </section>
  );
};
