import React from 'react';
import { RiSparklingFill } from 'react-icons/ri';
import { LiveCaption } from '../hooks/useVideoRoom';

interface LiveCaptionsOverlayProps {
  currentCaption: LiveCaption | null;
  isVisible: boolean;
}

export const LiveCaptionsOverlay: React.FC<LiveCaptionsOverlayProps> = ({
  currentCaption,
  isVisible,
}) => {
  if (!isVisible || !currentCaption || !currentCaption.text.trim()) {
    return null;
  }

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl w-[90%] z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-5 py-3 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border text-foreground shadow-2xl flex items-start gap-3.5">
        <div className="mt-0.5 w-7 h-7 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 shadow-inner">
          <RiSparklingFill className="w-4 h-4 animate-pulse" />
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary tracking-wide">
              {currentCaption.speakerName}
            </span>
            {currentCaption.isInterim && (
              <span className="text-[10px] text-muted-foreground font-mono italic">
                transcribing...
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed font-sans">
            {currentCaption.text}
          </p>
        </div>
      </div>
    </div>
  );
};
