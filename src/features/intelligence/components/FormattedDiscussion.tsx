import React from 'react';

interface FormattedDiscussionProps {
  content: string;
}

/**
 * Parses inline markdown syntax: **bold**, `code`, *italic*
 */
function renderFormattedInline(text: string): React.ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code
          key={i}
          className="inline-block px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono bg-muted text-foreground border border-border font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Professional, document-style discussion breakdown using semantic theme variables.
 */
export const FormattedDiscussion: React.FC<FormattedDiscussionProps> = ({
  content,
}) => {
  if (!content) return null;

  const rawSections = content.split(/(?=###?\s+)/);

  if (rawSections.length <= 1 && !content.includes('###')) {
    const paragraphs = content.split(/\n\s*\n/).filter(Boolean);
    return (
      <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
        {paragraphs.map((p, idx) => (
          <p key={idx}>{renderFormattedInline(p.trim())}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rawSections.map((section, idx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        const headingMatch = trimmed.match(/^###?\s+([^\n]+)\n?([\s\S]*)$/);

        if (headingMatch) {
          const rawTitle = headingMatch[1].trim();
          const body = headingMatch[2].trim();

          const numMatch = rawTitle.match(/^(\d+)\.\s*(.*)$/);
          const num = numMatch ? numMatch[1] : `${idx + 1}`;
          const title = numMatch ? numMatch[2] : rawTitle;

          const paragraphs = body.split(/\n\s*\n/).filter(Boolean);

          return (
            <div
              key={idx}
              className="space-y-2.5 pb-6 border-b border-border/60 last:border-b-0 last:pb-0"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {num}.
                </span>
                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                  {title}
                </h4>
              </div>

              <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed pl-5">
                {paragraphs.map((p, pIdx) => {
                  if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
                    const items = p.split(/\n[-*]\s+/).filter(Boolean);
                    return (
                      <ul key={pIdx} className="space-y-2 list-none">
                        {items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 shrink-0" />
                            <span>{renderFormattedInline(item.trim())}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={pIdx}>{renderFormattedInline(p.trim())}</p>;
                })}
              </div>
            </div>
          );
        }

        return (
          <div
            key={idx}
            className="text-xs text-muted-foreground leading-relaxed pb-4 border-b border-border/60 last:border-b-0"
          >
            {renderFormattedInline(trimmed)}
          </div>
        );
      })}
    </div>
  );
};
