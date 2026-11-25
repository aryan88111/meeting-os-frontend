import React, { useMemo, useState } from 'react';
import { RiSubtractLine, RiAddLine } from 'react-icons/ri';
import { Reveal } from './Reveal';

const faqItems = [
  {
    q: 'How does MeetingOS handle personal vs enterprise Microsoft accounts?',
    a: 'Microsoft 365 Work/Enterprise tenants publish events directly via Microsoft Graph API. If you log in with a personal account, MeetingOS automatically generates a direct Teams video link and activates our 1-click bulk attendee email copy system.'
  },
  {
    q: 'How does the pgvector semantic search retrieve meeting context?',
    a: 'Transcripts are diarized into sequential segments and converted into 768-dimensional embeddings via Google Gemini. Queries use PostgreSQL cosine distance (<->) to fetch exact timestamped dialogue matching your search intent.'
  },
  {
    q: 'Can we self-host or connect our existing database?',
    a: 'Yes. MeetingOS is open-architected with NestJS and Prisma ORM. You can point the backend to your own PostgreSQL instance with pgvector enabled.'
  }
];

export const FaqSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    }),
    []
  );

  return (
    <section id="faq" className="py-20 sm:py-28 max-w-2xl mx-auto px-5 sm:px-8 border-t border-border">
      {/* Structured data so search engines can render this FAQ as a rich result */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Reveal>
        <div className="mb-10">
          <div className="text-[12px] uppercase tracking-wide text-foreground/40 mb-3">FAQ</div>
          <h2 className="font-serif text-3xl text-foreground leading-tight">
            A few things people ask.
          </h2>
        </div>
      </Reveal>

      <div className="divide-y divide-border border-t border-border">
        {faqItems.map((item, index) => (
          <Reveal key={item.q} delayMs={index * 60}>
            <div>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full py-5 flex items-center justify-between text-left text-[15px] font-medium text-foreground/90 hover:text-foreground transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  {openFaq === index ? (
                    <RiSubtractLine className="h-4 w-4 text-foreground/50 shrink-0 ml-4" />
                  ) : (
                    <RiAddLine className="h-4 w-4 text-foreground/30 shrink-0 ml-4" />
                  )}
                </button>
              </h3>
              {/* Grid-rows trick: animates from 0fr to 1fr for a smooth height transition without a fixed max-height */}
              <div
                id={`faq-answer-${index}`}
                aria-hidden={openFaq !== index}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  openFaq === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-sm text-foreground/55 leading-relaxed max-w-lg">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
