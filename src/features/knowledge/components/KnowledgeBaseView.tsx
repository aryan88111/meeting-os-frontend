import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RiSparklingFill, 
  RiArrowRightUpLine, 
  RiLoader4Line, 
  RiFileCopyLine, 
  RiCheckLine, 
  RiArrowUpLine, 
  RiStopLine, 
  RiAddLine, 
  RiChat1Line, 
  RiDeleteBin6Line, 
  RiEditLine, 
  RiSidebarFoldLine, 
  RiSidebarUnfoldLine,
  RiCheckDoubleLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiUser3Line
} from 'react-icons/ri';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api';

interface Citation {
  meetingId: string;
  meetingTitle: string;
  speakerName?: string;
  timestampStartMs?: number;
  timestampFormatted?: string;
  snippet: string;
  type: 'DECISION' | 'ACTION_ITEM' | 'TRANSCRIPT' | 'SUMMARY' | 'TOPIC';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  relevantMeetings?: Array<{
    id: string;
    title: string;
    date?: string;
    summary?: string;
  }>;
  createdAt: string;
}

interface ChatSessionItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

/**
 * Parses inline markdown: **bold**, `code`, *italic*
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
          className="inline-block px-1.5 py-0.5 mx-0.5 rounded text-[12px] font-mono bg-muted text-foreground border border-border font-medium"
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
 * Clean editorial assistant text with headings, lists, paragraphs
 */
const FormattedAssistantMessage: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const sections = content.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="space-y-4 text-[13px] text-foreground/90 leading-relaxed font-normal">
      {sections.map((sec, idx) => {
        const trimmed = sec.trim();

        // Heading 3: ### Title
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-primary pt-2">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }

        // Heading 2: ## Title
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm font-bold text-foreground pt-2">
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Bullet List (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split(/\n[-*]\s+/).filter(Boolean);
          return (
            <ul key={idx} className="space-y-2 list-none pl-1">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-2 shrink-0" />
                  <span className="flex-1 leading-relaxed">
                    {renderFormattedInline(item.replace(/^[-*]\s+/, '').trim())}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="leading-relaxed">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Collapsible Grounding Evidence Citations Dropdown (Ultra-Compact & Theme Variable Compliant)
 */
const CitationsDropdown: React.FC<{
  citations: Citation[];
  onCopySnippet: (id: string, text: string) => void;
  copiedId: string | null;
}> = ({ citations, onCopySnippet, copiedId }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  const uniqueMeetings = Array.from(new Set(citations.map((c) => c.meetingTitle)));

  return (
    <div className="mt-2.5 pt-2 border-t border-border/50">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary border border-border text-[11px] text-muted-foreground hover:text-foreground font-medium transition-all group cursor-pointer shadow-2xs"
      >
        <RiShieldCheckLine className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="font-medium text-foreground">
          Grounding Sources ({citations.length})
        </span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          • {uniqueMeetings.length} {uniqueMeetings.length === 1 ? 'meeting' : 'meetings'}
        </span>
        {isOpen ? (
          <RiArrowUpSLine className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground ml-0.5 transition-transform" />
        ) : (
          <RiArrowDownSLine className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground ml-0.5 transition-transform" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {citations.map((cite, cIdx) => (
            <div
              key={cIdx}
              className="p-2 rounded-lg bg-card/70 hover:bg-card border border-border text-[11px] space-y-1.5 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-muted text-muted-foreground border border-border shrink-0">
                    {cite.type}
                  </span>
                  {cite.timestampFormatted && (
                    <span className="font-mono text-primary text-[9.5px] font-medium shrink-0">
                      [{cite.timestampFormatted}]
                    </span>
                  )}
                  {cite.speakerName && (
                    <span className="font-medium text-foreground text-[10.5px] truncate">
                      {cite.speakerName}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopySnippet(`cite-${cIdx}`, cite.snippet)}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  title="Copy citation snippet"
                >
                  {copiedId === `cite-${cIdx}` ? (
                    <RiCheckLine className="h-3 w-3 text-primary" />
                  ) : (
                    <RiFileCopyLine className="h-3 w-3" />
                  )}
                </Button>
              </div>

              <p className="text-muted-foreground italic text-[10.5px] leading-snug line-clamp-2 pl-1.5 border-l border-primary/40">
                &ldquo;{cite.snippet}&rdquo;
              </p>

              <div className="pt-0.5 flex items-center justify-between text-[10px]">
                <Link
                  to={`/meetings/${cite.meetingId}`}
                  className="text-primary hover:underline inline-flex items-center gap-0.5 truncate font-medium"
                >
                  <span className="truncate">{cite.meetingTitle}</span>
                  <RiArrowRightUpLine className="h-2.5 w-2.5 shrink-0" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const KnowledgeBaseView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Session Management
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch list of historical sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiClient.get<ChatSessionItem[], any>({
        url: '/api/v1/search/sessions',
      });
      if (res.data) {
        setSessions(res.data);
      }
    } catch (err) {
      console.warn('Failed to load chat sessions:', err);
    }
  }, []);

  // Fetch single session thread
  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsLoading(true);
    try {
      const res = await apiClient.get<any, any>({
        url: `/api/v1/search/sessions/${sessionId}`,
      });
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.warn('Failed to load session messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-scroll on new message or during loading
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [query]);

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setQuery('');
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete<any, any>({
        url: `/api/v1/search/sessions/${sessionId}`,
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleRenameSubmit = async (sessionId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      await apiClient.patch<any, any>({
        url: `/api/v1/search/sessions/${sessionId}`,
        body: { title: editTitle.trim() },
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: editTitle.trim() } : s))
      );
      setEditingSessionId(null);
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || query;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const res = await apiClient.post<any, any>({
        url: '/api/v1/search/ask',
        body: {
          query: textToSend.trim(),
          sessionId: currentSessionId || undefined,
        },
      });

      const data = res.data;
      if (data?.session?.id && !currentSessionId) {
        setCurrentSessionId(data.session.id);
        fetchSessions();
      }

      const botMsg: Message = {
        id: data?.assistantMessage?.id || `a-${Date.now()}`,
        role: 'assistant',
        content: data?.assistantMessage?.content || data?.answer || 'No specific answer found in recorded meeting transcripts.',
        citations: data?.assistantMessage?.citations || data?.citations || [],
        relevantMeetings: data?.assistantMessage?.relevantMeetings || data?.relevantMeetings || [],
        createdAt: data?.assistantMessage?.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Failed to query knowledge base: ${err.message || 'Server error'}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] w-full border border-border/70 rounded-2xl bg-card overflow-hidden shadow-xs animate-in fade-in duration-300">
      {/* ChatGPT / Gemini Session Drawer */}
      <div
        className={`border-r border-border/80 bg-sidebar-background transition-all duration-300 flex flex-col justify-between shrink-0 ${
          isSidebarOpen ? 'w-64 p-3' : 'w-0 p-0 border-r-0 overflow-hidden'
        }`}
      >
        <div className="space-y-3 overflow-hidden flex flex-col h-full">
          {/* Top Actions */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/70">
            <Button
              onClick={handleNewChat}
              size="sm"
              className="flex-1 h-8 text-xs font-medium justify-start gap-2 shadow-xs cursor-pointer"
            >
              <RiAddLine className="h-4 w-4" />
              <span>New Chat</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Close Sessions Drawer"
            >
              <RiSidebarFoldLine className="h-4 w-4" />
            </Button>
          </div>

          {/* Session Threads List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Chat History ({sessions.length})
            </div>

            {sessions.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-muted-foreground italic">
                No past chat sessions.
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = currentSessionId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <RiChat1Line className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                      {editingSessionId === s.id ? (
                        <form
                          onSubmit={(e) => handleRenameSubmit(s.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 mr-1"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => setEditingSessionId(null)}
                            className="w-full bg-background border border-primary text-[11px] px-1 py-0.5 rounded text-foreground outline-none"
                          />
                        </form>
                      ) : (
                        <span className="truncate text-[11px] leading-tight">{s.title}</span>
                      )}
                    </div>

                    {/* Quick Rename & Delete actions on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(s.id);
                          setEditTitle(s.title);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                        title="Rename"
                      >
                        <RiEditLine className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive"
                        title="Delete Session"
                      >
                        <RiDeleteBin6Line className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        {/* Top Floating Controls */}
        <div className="flex items-center justify-between p-3 px-5 border-b border-border/80 bg-background/80 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Open Chat Sessions"
              >
                <RiSidebarUnfoldLine className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <RiSparklingFill className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-sm text-foreground">
                {currentSessionId
                  ? sessions.find((s) => s.id === currentSessionId)?.title || 'Conversation'
                  : 'New Conversation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium flex items-center gap-1.5 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Meeting Intelligence
            </Badge>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth max-w-4xl w-full mx-auto">
          {messages.length === 0 ? (
            /* Hero Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 my-auto py-20">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
                <RiSparklingFill className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Ask anything across your meetings
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Query past discussions, architectural decisions, action items, or speaker quotes with verified transcript citations.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <RiSparklingFill className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={`space-y-2.5 rounded-2xl transition-all ${
                      isUser
                        ? 'bg-secondary text-foreground px-4 py-2.5 max-w-[80%] rounded-tr-sm border border-border shadow-2xs font-normal text-[13px]'
                        : 'bg-transparent text-foreground max-w-[92%] px-1 py-0.5'
                    }`}
                  >
                    {/* Message Body */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      <FormattedAssistantMessage content={msg.content} />
                    )}

                    {/* Grounding Citations Dropdown */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <CitationsDropdown
                        citations={msg.citations}
                        onCopySnippet={handleCopySnippet}
                        copiedId={copiedId}
                      />
                    )}

                    {/* Referenced Meetings */}
                    {!isUser && msg.relevantMeetings && msg.relevantMeetings.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground font-medium">Referenced:</span>
                        {msg.relevantMeetings.map((rm) => (
                          <Link
                            key={rm.id}
                            to={`/meetings/${rm.id}`}
                            className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-foreground hover:bg-muted transition border border-border"
                          >
                            {rm.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Assistant Message Actions Toolbar */}
                    {!isUser && (
                      <div className="pt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(`msg-${msg.id}`, msg.content)}
                          className="hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy response"
                        >
                          {copiedId === `msg-${msg.id}` ? (
                            <>
                              <RiCheckLine className="h-3 w-3 text-primary" />
                              <span className="text-primary font-medium">Copied answer</span>
                            </>
                          ) : (
                            <>
                              <RiFileCopyLine className="h-3 w-3" />
                              <span>Copy answer</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                <RiSparklingFill className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs py-1">
                <RiLoader4Line className="h-4 w-4 animate-spin text-primary" />
                <span>Analyzing transcripts and synthesizing answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Bar */}
        <div className="p-3 px-5 border-t border-border/80 bg-background/90 max-w-4xl w-full mx-auto shrink-0">
          <div className="relative rounded-2xl border border-border bg-card shadow-lg p-2 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
            <textarea
              ref={textareaRef}
              rows={1}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about past meetings, decisions, action items, or quotes..."
              disabled={isLoading}
              className="w-full bg-transparent border-0 resize-none px-3 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-40 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1 px-2 text-[10px] text-muted-foreground">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[9px]">Enter ↵</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[9px]">Shift+Enter</kbd> for new line</span>

              <Button
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || !query.trim()}
                size="sm"
                className="h-7 w-7 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center shadow-xs cursor-pointer"
              >
                {isLoading ? (
                  <RiStopLine className="h-3.5 w-3.5" />
                ) : (
                  <RiArrowUpLine className="h-4 w-4 font-bold" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
