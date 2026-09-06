import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RiCheckLine, RiFileCopyLine } from 'react-icons/ri';
import { Badge } from '@/components/ui/badge';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders priority/severity badges if text matches [HIGH Priority], [CRITICAL], [MEDIUM Priority], etc.
 */
function renderTextWithBadges(text: string): React.ReactNode {
  const badgeRegex = /\[(HIGH Priority|CRITICAL|HIGH|URGENT|MEDIUM Priority|MEDIUM|LOW Priority|LOW)\]/gi;
  const parts = text.split(badgeRegex);

  if (parts.length === 1) {
    return text;
  }

  const elements: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const upper = part.toUpperCase();

    if (upper === 'HIGH PRIORITY' || upper === 'CRITICAL' || upper === 'HIGH' || upper === 'URGENT') {
      elements.push(
        <Badge
          key={i}
          variant="destructive"
          className="inline-flex items-center text-[10px] px-1.5 py-0 rounded font-semibold uppercase tracking-wider mx-1 align-baseline shadow-2xs"
        >
          {part}
        </Badge>
      );
    } else if (upper === 'MEDIUM PRIORITY' || upper === 'MEDIUM') {
      elements.push(
        <Badge
          key={i}
          className="inline-flex items-center text-[10px] px-1.5 py-0 rounded font-semibold uppercase tracking-wider mx-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 align-baseline shadow-2xs"
        >
          {part}
        </Badge>
      );
    } else if (upper === 'LOW PRIORITY' || upper === 'LOW') {
      elements.push(
        <Badge
          key={i}
          variant="secondary"
          className="inline-flex items-center text-[10px] px-1.5 py-0 rounded font-semibold uppercase tracking-wider mx-1 text-muted-foreground align-baseline shadow-2xs"
        >
          {part}
        </Badge>
      );
    } else {
      elements.push(part);
    }
  }

  return <>{elements}</>;
}

/**
 * Code block with copy action
 */
const CodeBlock: React.FC<{ inline?: boolean; className?: string; children?: React.ReactNode }> = ({
  inline,
  className,
  children,
  ...props
}) => {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded text-[12px] font-mono bg-muted text-foreground border border-border/80 font-medium"
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2.5 rounded-xl border border-border bg-muted/40 overflow-hidden font-mono text-[12px]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/80 border-b border-border/60 text-[10px] text-muted-foreground">
        <span>Snippet</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <RiCheckLine className="h-3 w-3 text-primary" />
              <span className="text-primary font-medium">Copied</span>
            </>
          ) : (
            <>
              <RiFileCopyLine className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-foreground/90 leading-relaxed font-mono">
        <code>{text}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  return (
    <div className={`prose-custom text-[13px] text-foreground/90 leading-relaxed space-y-3 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-sm font-bold text-foreground mt-4 mb-2 tracking-tight border-b border-border/40 pb-1">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mt-3.5 mb-1.5">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mt-3 mb-1">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-xs font-semibold text-foreground/95 mt-2.5 mb-1">
              {children}
            </h5>
          ),
          p: ({ children }) => {
            if (typeof children === 'string') {
              return <p className="leading-relaxed my-1.5">{renderTextWithBadges(children)}</p>;
            }
            return <p className="leading-relaxed my-1.5">{children}</p>;
          },
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-4 list-disc marker:text-primary/70">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 pl-4 list-decimal marker:text-primary/70">
              {children}
            </ol>
          ),
          li: ({ children }) => {
            return (
              <li className="leading-relaxed pl-0.5 text-foreground/90">
                {React.Children.map(children, (child) => {
                  if (typeof child === 'string') {
                    return renderTextWithBadges(child);
                  }
                  return child;
                })}
              </li>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 border-l-2 border-primary/60 pl-3 py-1 bg-muted/30 rounded-r-lg text-xs text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => {
            if (typeof children === 'string') {
              return (
                <strong className="font-semibold text-foreground">
                  {renderTextWithBadges(children)}
                </strong>
              );
            }
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          em: ({ children }) => (
            <em className="italic text-muted-foreground font-normal">{children}</em>
          ),
          hr: () => <hr className="my-3 border-border/60" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60 text-foreground font-semibold border-b border-border">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-border/40">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/20 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-foreground font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-foreground/80">{children}</td>,
          code: CodeBlock as any,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
