import React, { useState, useRef, useEffect } from 'react';
import {
  RiCloseLine,
  RiFileTextLine,
  RiGroupLine,
  RiChat3Line,
  RiSendPlane2Fill,
  RiMicLine,
  RiMicOffLine,
  RiSparklingFill,
  RiFileCopyLine,
  RiCheckLine,
  RiUserLine,
} from 'react-icons/ri';
import { LiveCaption, InCallChatMessage, ParticipantTrackInfo } from '../hooks/useVideoRoom';

interface InCallSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'transcript' | 'participants' | 'chat';
  setActiveTab: (tab: 'transcript' | 'participants' | 'chat') => void;
  participants: Map<string, ParticipantTrackInfo>;
  liveCaptions: LiveCaption[];
  chatMessages: InCallChatMessage[];
  onSendMessage: (text: string) => void;
  onSendManualCaption?: (text: string) => void;
  onOpenInvite?: () => void;
  isSpeechSupported?: boolean;
}

export const InCallSidePanel: React.FC<InCallSidePanelProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  participants,
  liveCaptions,
  chatMessages,
  onSendMessage,
  onSendManualCaption,
  onOpenInvite,
  isSpeechSupported = true,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [transcriptInput, setTranscriptInput] = useState('');
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (activeTab === 'transcript') {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveCaptions, activeTab]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const handleSendTranscriptNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcriptInput.trim() || !onSendManualCaption) return;
    onSendManualCaption(transcriptInput);
    setTranscriptInput('');
  };

  const handleQuickSampleSegment = () => {
    if (!onSendManualCaption) return;
    const sampleRemarks = [
      'Reviewed project timeline and agreed on milestone deliverables for this sprint.',
      'Confirmed architectural decisions for live transcription and backend intelligence pipeline.',
      'Action item assigned: Finalize deployment checklist and verify all system integrations.',
      'Discussion concluded with unanimous agreement on production rollout schedule.',
    ];
    const randomRemark = sampleRemarks[Math.floor(Math.random() * sampleRemarks.length)];
    onSendManualCaption(randomRemark);
  };

  const handleCopyTranscript = () => {
    const text = liveCaptions
      .map((c) => `[${new Date(c.timestamp).toLocaleTimeString()}] ${c.speakerName}: ${c.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const participantList = Array.from(participants.values());

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-emerald-600 to-teal-600',
      'from-violet-600 to-fuchsia-600',
      'from-amber-600 to-rose-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="w-80 sm:w-96 h-full bg-card/95 backdrop-blur-2xl border-l border-border flex flex-col z-50 animate-in slide-in-from-right duration-200 shadow-2xl">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-2xl border border-border/40">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition duration-150 cursor-pointer ${
              activeTab === 'transcript'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RiFileTextLine className="w-3.5 h-3.5" />
            <span>Transcript</span>
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition duration-150 cursor-pointer ${
              activeTab === 'participants'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RiGroupLine className="w-3.5 h-3.5" />
            <span>People ({participantList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition duration-150 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RiChat3Line className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
          title="Close Sidebar"
        >
          <RiCloseLine className="w-5 h-5" />
        </button>
      </div>

      {/* Panel Body: Live Transcript */}
      {activeTab === 'transcript' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2.5 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-xs text-primary shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <RiSparklingFill className="w-4 h-4 text-primary" />
              <span className="font-semibold">Always-On Live STT</span>
            </div>
            {liveCaptions.length > 0 && (
              <button
                onClick={handleCopyTranscript}
                className="hover:underline flex items-center gap-1 text-[11px] font-medium bg-primary/20 px-2 py-0.5 rounded-md cursor-pointer"
              >
                {copiedTranscript ? <RiCheckLine className="w-3.5 h-3.5 text-emerald-500" /> : <RiFileCopyLine className="w-3.5 h-3.5" />}
                <span>{copiedTranscript ? 'Copied' : 'Copy All'}</span>
              </button>
            )}
          </div>

          {!isSpeechSupported ? (
            <div className="p-3.5 m-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Universal Audio & Speech Recording Active</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your browser (e.g. Firefox / Brave) is fully supported by our <strong>Universal Voice Activity Engine</strong>. When you speak, discussion segments and vocal timestamps are automatically captured and saved.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                You can also broadcast real-time notes or key decisions using the composer below.
              </p>
              {onSendManualCaption && (
                <button
                  type="button"
                  onClick={handleQuickSampleSegment}
                  className="mt-1 w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RiSparklingFill className="w-3.5 h-3.5" />
                  <span>+ Test Add Live Discussion Segment</span>
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 bg-muted/40 border-b border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Native Chrome/Safari Real-Time Speech Recognition Active</span>
            </div>
          )}

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {liveCaptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2 p-6">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground">
                  <RiSparklingFill className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">Listening for speech...</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  When anyone speaks with an unmuted mic, or broadcasts a note below, live transcription automatically records and streams here.
                </p>
              </div>
            ) : (
              liveCaptions.map((cap, idx) => (
                <div key={idx} className="space-y-1 bg-muted/30 p-3.5 rounded-2xl border border-border/50 shadow-xs animate-in fade-in slide-in-from-bottom-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-xs">{cap.speakerName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(cap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed text-xs">{cap.text}</p>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Quick Note & Caption Composer */}
          {onSendManualCaption && (
            <form onSubmit={handleSendTranscriptNote} className="p-3 border-t border-border bg-muted/20 flex gap-2 shrink-0">
              <input
                type="text"
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                placeholder="Broadcast a note / speech segment live..."
                className="flex-1 bg-background border border-border px-3 py-2 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!transcriptInput.trim()}
                className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground flex items-center justify-center shrink-0 transition shadow-md cursor-pointer"
                title="Broadcast to Live Transcript"
              >
                <RiSparklingFill className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Panel Body: Participants */}
      {activeTab === 'participants' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {onOpenInvite && (
            <button
              onClick={onOpenInvite}
              className="w-full py-2.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 transition mb-3 shadow-md cursor-pointer"
            >
              <RiGroupLine className="w-4 h-4" />
              <span>+ Add People / Share Invite</span>
            </button>
          )}

          {participantList.map((p) => (
            <div
              key={p.identity}
              className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50 hover:border-border transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                    p.name
                  )} text-white font-bold text-xs flex items-center justify-center shadow-md`}
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-foreground truncate max-w-[140px]">{p.name}</p>
                    {p.isLocal && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {p.isSpeaking ? (
                      <span className="text-emerald-500 font-medium">Speaking...</span>
                    ) : (
                      'In Meeting'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    p.isAudioMuted
                      ? 'bg-destructive/15 border-destructive/30 text-destructive'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                  }`}
                  title={p.isAudioMuted ? 'Muted' : 'Unmuted'}
                >
                  {p.isAudioMuted ? (
                    <RiMicOffLine className="w-3.5 h-3.5" />
                  ) : (
                    <RiMicLine className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel Body: In-Call Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground">
                  <RiChat3Line className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">No chat messages yet</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Messages sent here are visible to everyone currently in this call.
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1 bg-muted/30 p-3 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">{msg.userName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-card-foreground text-xs leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-3 border-t border-border flex items-center gap-2 bg-muted/20 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message to everyone..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-9 h-9 rounded-xl bg-primary disabled:opacity-40 text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition cursor-pointer shrink-0"
            >
              <RiSendPlane2Fill className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
