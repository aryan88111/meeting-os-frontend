import React from 'react';
import {
  RiMicLine,
  RiMicOffLine,
  RiCameraLine,
  RiCameraOffLine,
  RiComputerLine,
  RiSparklingFill,
  RiFileTextLine,
  RiGroupLine,
  RiChat3Line,
  RiPhoneFill,
} from 'react-icons/ri';

interface MediaControlsProps {
  isMicMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isCaptionsVisible: boolean;
  isSidePanelOpen: boolean;
  activeSidePanelTab: 'transcript' | 'participants' | 'chat';
  participantCount?: number;
  unreadChatCount?: number;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleCaptions: () => void;
  onOpenSidePanelTab: (tab: 'transcript' | 'participants' | 'chat') => void;
  onLeaveCall: () => void;
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  isMicMuted,
  isVideoMuted,
  isScreenSharing,
  isCaptionsVisible,
  isSidePanelOpen,
  activeSidePanelTab,
  participantCount = 1,
  unreadChatCount = 0,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleCaptions,
  onOpenSidePanelTab,
  onLeaveCall,
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-3 rounded-2xl sm:rounded-3xl bg-card/90 backdrop-blur-2xl border border-border shadow-2xl ring-1 ring-border/50 animate-in slide-in-from-bottom-6 duration-300 select-none max-w-[95vw] overflow-x-auto no-scrollbar text-foreground">
      {/* Microphone Toggle */}
      <button
        onClick={onToggleMic}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isMicMuted
            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25 ring-2 ring-destructive/30 scale-95'
            : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 hover:scale-105 active:scale-95'
        }`}
        title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {isMicMuted ? <RiMicOffLine className="w-5 h-5" /> : <RiMicLine className="w-5 h-5 text-emerald-500" />}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={onToggleCamera}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isVideoMuted
            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25 ring-2 ring-destructive/30 scale-95'
            : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 hover:scale-105 active:scale-95'
        }`}
        title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
      >
        {isVideoMuted ? <RiCameraOffLine className="w-5 h-5" /> : <RiCameraLine className="w-5 h-5" />}
      </button>

      {/* Screen Share Toggle */}
      <button
        onClick={onToggleScreenShare}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isScreenSharing
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
            : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 hover:scale-105 active:scale-95'
        }`}
        title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
      >
        <RiComputerLine className="w-5 h-5" />
      </button>

      <div className="w-px h-6 bg-border mx-1 shrink-0" />

      {/* Live Captions Toggle */}
      <button
        onClick={onToggleCaptions}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isCaptionsVisible
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/40'
            : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 hover:scale-105 active:scale-95'
        }`}
        title="Toggle Real-Time Subtitles"
      >
        <RiSparklingFill className="w-5 h-5" />
      </button>

      {/* Live Transcript Sidebar */}
      <button
        onClick={() => onOpenSidePanelTab('transcript')}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isSidePanelOpen && activeSidePanelTab === 'transcript'
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/40'
            : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 hover:scale-105 active:scale-95'
        }`}
        title="Open Live Diarized Transcript"
      >
        <RiFileTextLine className="w-5 h-5" />
      </button>

      {/* Participants List */}
      <button
        onClick={() => onOpenSidePanelTab('participants')}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isSidePanelOpen && activeSidePanelTab === 'participants'
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/40'
            : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 hover:scale-105 active:scale-95'
        }`}
        title="View Meeting Participants"
      >
        <RiGroupLine className="w-5 h-5" />
        {participantCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground border border-primary/30 shadow-xs">
            {participantCount}
          </span>
        )}
      </button>

      {/* In-Call Chat */}
      <button
        onClick={() => onOpenSidePanelTab('chat')}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isSidePanelOpen && activeSidePanelTab === 'chat'
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/40'
            : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 hover:scale-105 active:scale-95'
        }`}
        title="In-Call Chat"
      >
        <RiChat3Line className="w-5 h-5" />
        {unreadChatCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-pulse">
            {unreadChatCount}
          </span>
        )}
      </button>

      <div className="w-px h-6 bg-border mx-1 shrink-0" />

      {/* End / Leave Call */}
      <button
        onClick={onLeaveCall}
        className="px-4 sm:px-5 h-11 sm:h-12 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold flex items-center gap-2 shadow-lg shadow-destructive/25 ring-2 ring-destructive/30 transition-all duration-200 cursor-pointer shrink-0 hover:scale-105 active:scale-95"
        title="Leave Meeting Room"
      >
        <RiPhoneFill className="w-5 h-5 rotate-[135deg]" />
        <span className="text-xs sm:text-sm font-medium">Leave</span>
      </button>
    </div>
  );
};
