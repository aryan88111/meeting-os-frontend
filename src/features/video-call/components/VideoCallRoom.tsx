import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  RiLoader4Line,
  RiVideoChatLine,
  RiArrowLeftLine,
  RiSparklingFill,
  RiRecordCircleLine,
  RiShieldCheckLine,
  RiShareLine,
} from 'react-icons/ri';

import { useVideoRoom } from '../hooks/useVideoRoom';
import { ParticipantVideoTile } from './ParticipantVideoTile';
import { MediaControls } from './MediaControls';
import { LiveCaptionsOverlay } from './LiveCaptionsOverlay';
import { InCallSidePanel } from './InCallSidePanel';
import { DevicePreviewModal } from './DevicePreviewModal';
import { InviteModal } from './InviteModal';
import { meetingsControllerGetMeeting } from '@/api';

export const VideoCallRoom: React.FC = () => {
  const { id: meetingId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meetingDetails, setMeetingDetails] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(true);
  const [isCaptionsVisible, setIsCaptionsVisible] = useState(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<'transcript' | 'participants' | 'chat'>('transcript');
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);


  const {
    room,
    connectionState,
    participants,
    activeSpeakerId,
    isMicMuted,
    isVideoMuted,
    isScreenSharing,
    liveCaptions,
    currentCaption,
    chatMessages,
    isLoading,
    error,
    connect,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
    sendManualCaption,
    leaveRoom,
    isSpeechSupported,
  } = useVideoRoom(meetingId || '');

  // Load meeting metadata
  useEffect(() => {
    if (meetingId) {
      meetingsControllerGetMeeting({
        path: { id: meetingId },
      })
        .then((res) => {
          if (res.data) {
            setMeetingDetails(res.data);
          }
        })
        .catch((err) => {
          console.warn('Failed to load meeting details:', err);
        });
    }
  }, [meetingId]);

  // Meeting timer
  useEffect(() => {
    if (!showPreviewModal && connectionState === 'connected') {
      const interval = setInterval(() => {
        setCallDurationSec((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showPreviewModal, connectionState]);

  const handleJoinFromPreview = (opts: { audio: boolean; video: boolean }) => {
    setShowPreviewModal(false);
    connect(opts);
  };

  const handleLeaveCall = async () => {
    const isHost = meetingDetails?.createdBy === meetingDetails?.creator?.id;
    const confirmEnd = window.confirm(
      isHost
        ? 'Do you want to end this meeting for all participants and generate AI intelligence?'
        : 'Are you sure you want to leave this meeting room?'
    );

    if (confirmEnd) {
      await leaveRoom(isHost);
      navigate(`/meetings/${meetingId}`);
    }
  };

  const handleOpenSidePanelTab = (tab: 'transcript' | 'participants' | 'chat') => {
    if (isSidePanelOpen && activeSidePanelTab === tab) {
      setIsSidePanelOpen(false);
    } else {
      setActiveSidePanelTab(tab);
      setIsSidePanelOpen(true);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (showPreviewModal) {
    return (
      <DevicePreviewModal
        meetingTitle={meetingDetails?.title || 'Meeting Room'}
        onJoin={handleJoinFromPreview}
        onCancel={() => navigate(`/meetings/${meetingId}`)}
      />
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const participantList = Array.from(participants.values());
  const screenSharer = participantList.find((p) => p.isScreenSharing);

  // Compute responsive video grid classes for non-spotlight mode
  const getGridClasses = (count: number) => {
    if (count <= 1) return 'grid-cols-1 max-w-4xl max-h-[75vh]';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl max-h-[80vh]';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl max-h-[82vh]';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-6xl max-h-[85vh]';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-7xl max-h-[88vh]';
  };

  return (
    <div className="relative w-screen h-screen bg-background text-foreground overflow-hidden flex flex-col font-sans select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      {/* Top Navbar */}
      <header className="h-14 px-4 sm:px-6 border-b border-border bg-card/85 backdrop-blur-2xl flex items-center justify-between z-30 shrink-0 text-foreground shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/meetings/${meetingId}`}
            className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition shrink-0"
            title="Exit to Meeting Details"
          >
            <RiArrowLeftLine className="w-4 h-4" />
          </Link>
          <img
            src="/logo.png"
            alt="MeetingOS Logo"
            className="w-7 h-7 rounded-lg object-contain shadow-md shadow-primary/25 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-md">
              {meetingDetails?.title || 'Video Call Room'}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live SFU Room
              </span>
              <span>•</span>
              <span className="font-mono text-foreground/80">{formatTimer(callDurationSec)}</span>
              <span>•</span>
              <span>{participantList.length} {participantList.length === 1 ? 'person' : 'people'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Copy Meeting Invite Link"
          >
            <RiShareLine className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/25 transition cursor-pointer"
            title="Add Attendees"
          >
            <span>+ Add People</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <RiSparklingFill className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Live Transcription</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/50 border border-border text-muted-foreground text-xs font-mono">
            <RiShieldCheckLine className="w-3.5 h-3.5 text-emerald-500" />
            <span>E2EE</span>
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        {/* Video Tiles Canvas */}
        <main className="flex-1 p-3 sm:p-5 flex items-center justify-center min-h-0 min-w-0 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <RiLoader4Line className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Connecting to Media Server...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center max-w-md">
              <p className="text-sm font-semibold text-destructive mb-2">Connection Notice</p>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => connect()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : screenSharer ? (
            /* Spotlight Mode: Screen Share Dominant + Side/Bottom Filmstrip */
            <div className="w-full h-full flex flex-col md:flex-row gap-3 min-h-0 max-w-7xl mx-auto">
              {/* Primary Screen Share Tile */}
              <div className="flex-1 min-h-0 min-w-0 h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                <ParticipantVideoTile
                  participant={screenSharer}
                  isActiveSpeaker={activeSpeakerId === screenSharer.identity}
                  isSpotlight={true}
                />
              </div>

              {/* Filmstrip of Attendees */}
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-64 lg:w-72 shrink-0 max-h-[140px] md:max-h-full py-1">
                {participantList
                  .filter((p) => p.identity !== screenSharer.identity)
                  .map((participant) => (
                    <div
                      key={participant.identity}
                      className="w-44 md:w-full aspect-video shrink-0 rounded-xl sm:rounded-2xl overflow-hidden"
                    >
                      <ParticipantVideoTile
                        participant={participant}
                        isActiveSpeaker={activeSpeakerId === participant.identity}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Normal Responsive Grid Mode */
            <div
              className={`w-full h-full grid gap-3 sm:gap-4 mx-auto items-center justify-center ${getGridClasses(
                Math.max(1, participantList.length)
              )}`}
            >
              {participantList.map((participant) => (
                <div
                  key={participant.identity}
                  className="w-full h-full aspect-video flex items-center justify-center max-h-[85vh]"
                >
                  <ParticipantVideoTile
                    participant={participant}
                    isActiveSpeaker={activeSpeakerId === participant.identity}
                  />
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Live Subtitle Overlay */}
        <LiveCaptionsOverlay
          currentCaption={currentCaption}
          isVisible={isCaptionsVisible}
        />

        {/* Floating Glass Media Controls Dock */}
        <MediaControls
          isMicMuted={isMicMuted}
          isVideoMuted={isVideoMuted}
          isScreenSharing={isScreenSharing}
          isCaptionsVisible={isCaptionsVisible}
          isSidePanelOpen={isSidePanelOpen}
          activeSidePanelTab={activeSidePanelTab}
          participantCount={participantList.length}
          unreadChatCount={0}
          onToggleMic={toggleMicrophone}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onToggleCaptions={() => setIsCaptionsVisible((prev) => !prev)}
          onOpenSidePanelTab={handleOpenSidePanelTab}
          onLeaveCall={handleLeaveCall}
        />

        {/* Side Panel (Transcript, Attendees, Chat) */}
        <InCallSidePanel
          isOpen={isSidePanelOpen}
          onClose={() => setIsSidePanelOpen(false)}
          activeTab={activeSidePanelTab}
          setActiveTab={setActiveSidePanelTab}
          participants={participants}
          liveCaptions={liveCaptions}
          chatMessages={chatMessages}
          onSendMessage={sendChatMessage}
          onSendManualCaption={sendManualCaption}
          onOpenInvite={() => setIsInviteOpen(true)}
          isSpeechSupported={isSpeechSupported}
        />

        {/* Share / Invite Modal */}
        <InviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          meetingId={meetingId || ''}
          meetingTitle={meetingDetails?.title || 'Meeting Room'}
          participants={meetingDetails?.participants || []}
          onParticipantAdded={(newP) => {
            setMeetingDetails((prev: any) => ({
              ...prev,
              participants: [...(prev?.participants || []), { id: `new_${Date.now()}`, ...newP }],
            }));
          }}
        />
      </div>
    </div>
  );
};

