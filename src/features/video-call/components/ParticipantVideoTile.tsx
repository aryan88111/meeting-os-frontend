import React, { useEffect, useRef } from 'react';
import {
  RiMicOffLine,
  RiMicLine,
  RiComputerLine,
} from 'react-icons/ri';
import { ParticipantTrackInfo } from '../hooks/useVideoRoom';

interface ParticipantVideoTileProps {
  participant: ParticipantTrackInfo;
  isActiveSpeaker: boolean;
  isSpotlight?: boolean;
}

export const ParticipantVideoTile: React.FC<ParticipantVideoTileProps> = ({
  participant,
  isActiveSpeaker,
  isSpotlight = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Attach video track
  useEffect(() => {
    const videoEl = videoRef.current;
    const track = participant.screenPublication?.track || participant.cameraPublication?.track;

    if (videoEl && track) {
      track.attach(videoEl);
      return () => {
        track.detach(videoEl);
      };
    }
  }, [participant.cameraPublication?.track, participant.screenPublication?.track]);

  // Attach remote audio track
  useEffect(() => {
    const audioEl = audioRef.current;
    const audioTrack = participant.audioPublication?.track;

    if (audioEl && audioTrack && !participant.isLocal) {
      audioTrack.attach(audioEl);
      return () => {
        audioTrack.detach(audioEl);
      };
    }
  }, [participant.audioPublication?.track, participant.isLocal]);

  const hasVideo = !participant.isVideoMuted || participant.isScreenSharing;
  const isMirror = participant.isLocal && !participant.isScreenSharing;

  // Generate consistent color hash for participant avatar
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-600/40 via-indigo-600/30 to-purple-600/40',
      'from-emerald-600/40 via-teal-600/30 to-cyan-600/40',
      'from-violet-600/40 via-fuchsia-600/30 to-pink-600/40',
      'from-amber-600/40 via-orange-600/30 to-rose-600/40',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div
      className={`group relative w-full h-full min-h-[160px] bg-card rounded-2xl sm:rounded-3xl overflow-hidden flex items-center justify-center border transition-all duration-300 shadow-xl ${
        isActiveSpeaker || participant.isSpeaking
          ? 'border-primary ring-2 ring-primary/80 ring-offset-2 ring-offset-background shadow-primary/25'
          : 'border-border/80 hover:border-border'
      }`}
    >
      {/* Remote Audio Stream Element (Only for remote participants) */}
      {!participant.isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
        />
      )}

      {/* Video Stream Element with Smooth Fade-In and Local Mirroring */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal} // Always mute local video playback to prevent feedback loop
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isMirror ? '-scale-x-100' : ''
        } ${hasVideo ? 'opacity-100' : 'opacity-0 absolute'}`}
      />

      {/* Luxury Placeholder Avatar when camera is disabled */}
      {!hasVideo && (
        <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300 select-none">
          <div
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${getAvatarGradient(
              participant.name
            )} border-2 border-border/40 flex items-center justify-center shadow-2xl transition-transform duration-300 ${
              participant.isSpeaking ? 'scale-105 ring-4 ring-primary/40' : ''
            }`}
          >
            <span className="text-2xl sm:text-3xl font-bold text-primary-foreground uppercase tracking-wider drop-shadow-md">
              {participant.name.slice(0, 2)}
            </span>

            {/* Speaking Pulse Ring */}
            {participant.isSpeaking && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-60" />
            )}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <p className="text-[11px] font-medium text-foreground tracking-wide">Camera Off</p>
          </div>
        </div>
      )}

      {/* Screen Sharing Indicator Chip */}
      {participant.isScreenSharing && (
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-emerald-500/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl border border-emerald-400/30 animate-in fade-in">
          <RiComputerLine className="w-4 h-4 animate-pulse" />
          <span>Presenting Screen</span>
        </div>
      )}

      {/* Bottom Floating Information Pill */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="px-3 py-1.5 rounded-xl bg-card/90 backdrop-blur-xl border border-border text-foreground text-xs font-medium flex items-center gap-2 shadow-xl">
          <span className="truncate max-w-[140px] sm:max-w-[180px]">
            {participant.name} {participant.isLocal && <span className="text-primary font-bold">(You)</span>}
          </span>

          {/* Dynamic 3-Bar Equalizer */}
          {participant.isSpeaking && (
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          )}
        </div>

        {/* Mic Status Indicator Badge */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xl backdrop-blur-xl border transition-colors ${
            participant.isAudioMuted
              ? 'bg-destructive/95 border-destructive/40 text-destructive-foreground'
              : 'bg-card/90 border-border text-emerald-500'
          }`}
          title={participant.isAudioMuted ? 'Muted' : 'Microphone Active'}
        >
          {participant.isAudioMuted ? (
            <RiMicOffLine className="w-4 h-4" />
          ) : (
            <RiMicLine className="w-4 h-4" />
          )}
        </div>
      </div>
    </div>
  );
};
