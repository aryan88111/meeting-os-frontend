import React from 'react';
import { RiArrowRightLine } from 'react-icons/ri';
import { Reveal } from './Reveal';

const STEPS = [
  {
    number: '01',
    title: 'Capture the call',
    description: 'MeetingOS joins Google Meet, Teams, or Zoom automatically and starts recording the moment the meeting begins — no extension required.'
  },
  {
    number: '02',
    title: 'Diarize & extract',
    description: 'Speakers are separated in seconds. Decisions and action items are pulled out and embedded for search.'
  },
  {
    number: '03',
    title: 'Ask, anytime',
    description: 'Query every past meeting in plain language. MeetingOS finds the exact moment, speaker, and timestamp behind the answer.'
  }
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 max-w-6xl mx-auto px-5 sm:px-8 border-t border-border">
      <Reveal>
        <div className="max-w-xl mb-16">
          <div className="text-[12px] uppercase tracking-wide text-foreground/40 mb-3">How it works</div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight">
            From live audio to searchable knowledge, in three steps.
          </h2>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
        {STEPS.map((step, idx) => (
          <Reveal key={step.number} delayMs={idx * 120}>
            <div className="md:pr-6">
              <div className="font-serif italic text-4xl text-foreground/20 mb-4">{step.number}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-foreground/55 leading-relaxed">
                {step.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delayMs={360}>
        <div className="mt-14">
          <a
            href="#pricing"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border-b border-foreground/30 hover:border-foreground pb-0.5 transition-all cursor-pointer"
          >
            See what&apos;s included in every plan
            <RiArrowRightLine className="h-3.5 w-3.5" />
          </a>
        </div>
      </Reveal>
    </section>
  );
};
