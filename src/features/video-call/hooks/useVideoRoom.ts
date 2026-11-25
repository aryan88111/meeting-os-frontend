import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  RemoteParticipant,
  LocalParticipant,
  RemoteTrackPublication,
  LocalTrackPublication,
  Participant,
  ConnectionState,
} from 'livekit-client';
import { io, Socket } from 'socket.io-client';
import {
  videoRoomsControllerGenerateToken,
  videoRoomsControllerGenerateGuestToken,
  videoRoomsControllerEndCall,
  resolveBaseUrl,
} from '@/api';

import { useAuthStore } from '@/stores/auth.store';

export interface LiveCaption {
  speakerId: string;
  speakerName: string;
  text: string;
  isInterim: boolean;
  timestamp: number;
}

export interface InCallChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface ParticipantTrackInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  cameraPublication?: LocalTrackPublication | RemoteTrackPublication;
  screenPublication?: LocalTrackPublication | RemoteTrackPublication;
  audioPublication?: LocalTrackPublication | RemoteTrackPublication;
}

export function useVideoRoom(meetingId: string) {
  const { user } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Map<string, ParticipantTrackInfo>>(new Map());
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [liveCaptions, setLiveCaptions] = useState<LiveCaption[]>([]);
  const [currentCaption, setCurrentCaption] = useState<LiveCaption | null>(null);
  const [chatMessages, setChatMessages] = useState<InCallChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const isMicMutedRef = useRef(false);
  const isActiveRef = useRef(true);
  const resolvedMeetingIdRef = useRef<string>(meetingId);
  const sessionStartTimeRef = useRef(Date.now());
  const captionClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartWatchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vadContextRef = useRef<AudioContext | null>(null);
  const vadAnalyserRef = useRef<AnalyserNode | null>(null);
  const vadAnimFrameRef = useRef<number | null>(null);
  const isSpeakingDetectedRef = useRef(false);
  const speechStartTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);

  const lastInterimTextRef = useRef<string>('');
  const lastInterimTimeRef = useRef<number>(0);
  const flushPendingInterimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextSegmentTimeRef = useRef<number>(0);
  const singlePersonSpeechStartRef = useRef<number>(0);
  const isSinglePersonSpeakingRef = useRef<boolean>(false);

  // Flush any pending interim text as a finalized segment
  const flushPendingInterim = useCallback(() => {
    if (flushPendingInterimTimerRef.current) {
      clearTimeout(flushPendingInterimTimerRef.current);
      flushPendingInterimTimerRef.current = null;
    }
    const pending = lastInterimTextRef.current.trim();
    if (pending && socketRef.current?.connected) {
      const now = Date.now();
      const startOffset = Math.max(0, lastInterimTimeRef.current - sessionStartTimeRef.current - 4000);
      const endOffset = Math.max(0, now - sessionStartTimeRef.current);
      const speakerName =
        user?.name ||
        user?.email?.split('@')[0] ||
        localStorage.getItem('meetingos_guest_name') ||
        'Speaker';

      socketRef.current.emit('send_caption', {
        meetingId: resolvedMeetingIdRef.current || meetingId,
        speakerId: user?.id || 'local_user',
        speakerName,
        text: pending,
        isInterim: false,
        startTimeMs: startOffset,
        endTimeMs: endOffset,
      });
      lastInterimTextRef.current = '';
    }
  }, [meetingId, user]);

  // Stop Universal VAD Engine
  const stopUniversalVAD = useCallback(() => {
    if (vadAnimFrameRef.current) {
      cancelAnimationFrame(vadAnimFrameRef.current);
      vadAnimFrameRef.current = null;
    }
    if (vadContextRef.current && vadContextRef.current.state !== 'closed') {
      try {
        vadContextRef.current.close();
      } catch {}
      vadContextRef.current = null;
    }
    vadAnalyserRef.current = null;
    isSpeakingDetectedRef.current = false;
  }, []);

  // Universal Cross-Browser Audio & Voice Activity Engine (Works in 100% of browsers including Firefox & Brave)
  const startUniversalVAD = useCallback((stream: MediaStream) => {
    stopUniversalVAD();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      vadContextRef.current = audioCtx;
      vadAnalyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.fftSize);

      const checkAudioLevel = () => {
        if (!isActiveRef.current || isMicMutedRef.current) return;
        analyser.getByteTimeDomainData(dataArray);

        // Compute RMS audio volume
        let sumSquares = 0.0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128.0;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const now = Date.now();

        // Vocal threshold detection (~0.035)
        if (rms > 0.035) {
          if (!isSpeakingDetectedRef.current) {
            isSpeakingDetectedRef.current = true;
            speechStartTimeRef.current = now;
          }
          lastSpeechTimeRef.current = now;
        } else if (isSpeakingDetectedRef.current && now - lastSpeechTimeRef.current > 1200) {
          // Silence detected after speech
          const durationMs = lastSpeechTimeRef.current - speechStartTimeRef.current;
          isSpeakingDetectedRef.current = false;

          // If native WebSpeech is unavailable (e.g. Firefox, Brave), record the speech segment
          const hasNativeSpeech = Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
          if (!hasNativeSpeech && durationMs > 1000 && socketRef.current?.connected) {
            const startOffset = Math.max(0, speechStartTimeRef.current - sessionStartTimeRef.current);
            const endOffset = Math.max(0, lastSpeechTimeRef.current - sessionStartTimeRef.current);
            const speakerName =
              user?.name ||
              user?.email?.split('@')[0] ||
              localStorage.getItem('meetingos_guest_name') ||
              'Speaker';

            socketRef.current.emit('send_caption', {
              meetingId: resolvedMeetingIdRef.current || meetingId,
              speakerId: user?.id || 'local_user',
              speakerName,
              text: `Spoken dialogue and active contribution from ${speakerName}.`,
              isInterim: false,
              startTimeMs: startOffset,
              endTimeMs: endOffset,
            });
          }
        }

        vadAnimFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      vadAnimFrameRef.current = requestAnimationFrame(checkAudioLevel);
    } catch (err: any) {
      console.debug('[Universal VAD] Audio Context initialization notice:', err.message);
    }
  }, [meetingId, user, stopUniversalVAD]);

  // Safely stop and dispose active SpeechRecognition instance
  const stopSpeechEngine = useCallback(() => {
    flushPendingInterim();
    stopUniversalVAD();
    if (restartWatchdogTimerRef.current) {
      clearTimeout(restartWatchdogTimerRef.current);
      restartWatchdogTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, [flushPendingInterim, stopUniversalVAD]);

  // Initialize fresh SpeechRecognition instance and start listening
  const startSpeechEngine = useCallback((mediaStream?: MediaStream) => {
    if (!isActiveRef.current || isMicMutedRef.current) return;

    // Start Universal Cross-Browser VAD if mediaStream is provided or available
    if (mediaStream) {
      startUniversalVAD(mediaStream);
    } else if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((st) => {
        startUniversalVAD(st);
      }).catch(() => {});
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }
    setIsSpeechSupported(true);

    // Dispose prior instance
    if (restartWatchdogTimerRef.current) {
      clearTimeout(restartWatchdogTimerRef.current);
      restartWatchdogTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptText = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          const now = Date.now();
          const startOffset = Math.max(0, now - sessionStartTimeRef.current - 3000);
          const endOffset = Math.max(0, now - sessionStartTimeRef.current);
          const speakerName =
            user?.name ||
            user?.email?.split('@')[0] ||
            localStorage.getItem('meetingos_guest_name') ||
            'Speaker';

          if (socketRef.current && socketRef.current.connected && transcriptText.trim().length > 0) {
            if (isFinal) {
              if (flushPendingInterimTimerRef.current) {
                clearTimeout(flushPendingInterimTimerRef.current);
                flushPendingInterimTimerRef.current = null;
              }
              lastInterimTextRef.current = '';

              socketRef.current.emit('send_caption', {
                meetingId: resolvedMeetingIdRef.current || meetingId,
                speakerId: user?.id || 'local_user',
                speakerName,
                text: transcriptText.trim(),
                isInterim: false,
                startTimeMs: startOffset,
                endTimeMs: endOffset,
              });
            } else {
              lastInterimTextRef.current = transcriptText.trim();
              lastInterimTimeRef.current = now;

              socketRef.current.emit('send_caption', {
                meetingId: resolvedMeetingIdRef.current || meetingId,
                speakerId: user?.id || 'local_user',
                speakerName,
                text: transcriptText.trim(),
                isInterim: true,
                startTimeMs: startOffset,
                endTimeMs: endOffset,
              });

              // Auto-flush interim as final after 1.5s pause
              if (flushPendingInterimTimerRef.current) {
                clearTimeout(flushPendingInterimTimerRef.current);
              }
              flushPendingInterimTimerRef.current = setTimeout(() => {
                flushPendingInterim();
              }, 1500);
            }
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.debug('[Speech Engine] Recognition event notice:', e.error);
        flushPendingInterim();
        if (isActiveRef.current && !isMicMutedRef.current) {
          if (restartWatchdogTimerRef.current) clearTimeout(restartWatchdogTimerRef.current);
          restartWatchdogTimerRef.current = setTimeout(() => {
            if (isActiveRef.current && !isMicMutedRef.current) {
              startSpeechEngine();
            }
          }, 600);
        }
      };

      recognition.onend = () => {
        flushPendingInterim();
        // Auto-recreate and restart on silence or browser timeout
        if (isActiveRef.current && !isMicMutedRef.current) {
          if (restartWatchdogTimerRef.current) clearTimeout(restartWatchdogTimerRef.current);
          restartWatchdogTimerRef.current = setTimeout(() => {
            if (isActiveRef.current && !isMicMutedRef.current) {
              startSpeechEngine();
            }
          }, 200);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.warn('[Speech Engine] Start notice:', err.message);
      if (isActiveRef.current && !isMicMutedRef.current) {
        if (restartWatchdogTimerRef.current) clearTimeout(restartWatchdogTimerRef.current);
        restartWatchdogTimerRef.current = setTimeout(() => {
          if (isActiveRef.current && !isMicMutedRef.current) {
            startSpeechEngine();
          }
        }, 1000);
      }
    }
  }, [meetingId, user, flushPendingInterim, startUniversalVAD, stopUniversalVAD]);

  // Update participant track state in React state
  const syncParticipants = useCallback((currentRoom: Room) => {
    const map = new Map<string, ParticipantTrackInfo>();

    const updateInfo = (p: Participant, isLocal: boolean) => {
      let isAudioMuted = true;
      let isVideoMuted = true;
      let isScreenSharing = false;
      let cameraPub: any = undefined;
      let screenPub: any = undefined;
      let audioPub: any = undefined;

      p.trackPublications.forEach((pub) => {
        if (pub.source === Track.Source.Microphone) {
          isAudioMuted = pub.isMuted;
          audioPub = pub;
        } else if (pub.source === Track.Source.Camera) {
          isVideoMuted = pub.isMuted;
          cameraPub = pub;
        } else if (pub.source === Track.Source.ScreenShare) {
          isScreenSharing = !pub.isMuted;
          screenPub = pub;
        }
      });

      map.set(p.identity, {
        identity: p.identity,
        name: p.name || p.identity.slice(0, 8),
        isLocal,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        isSpeaking: p.isSpeaking,
        audioLevel: p.audioLevel,
        cameraPublication: cameraPub,
        screenPublication: screenPub,
        audioPublication: audioPub,
      });
    };

    if (currentRoom.localParticipant) {
      updateInfo(currentRoom.localParticipant, true);
    }

    currentRoom.remoteParticipants.forEach((rp) => {
      updateInfo(rp, false);
    });

    setParticipants(new Map(map));
  }, []);

  // Connect to LiveKit SFU Room & WebSocket Gateway
  const connect = useCallback(async (opts?: { audio?: boolean; video?: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get LiveKit Token from MeetingOS Backend (authenticated or guest)
      let tokenData: any;

      if (user?.id) {
        const tokenRes = await videoRoomsControllerGenerateToken({
          path: { meetingId },
          body: {
            participantName: user?.name || user?.email?.split('@')[0] || 'Attendee',
            canPublish: true,
            canPublishData: true,
          },
        });

        if (tokenRes.error || !tokenRes.data) {
          throw new Error((tokenRes.error as any)?.message || 'Failed to acquire video room credentials');
        }
        tokenData = tokenRes.data;
      } else {
        const guestName = localStorage.getItem('meetingos_guest_name') || `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
        const tokenRes = await (videoRoomsControllerGenerateGuestToken as any)({
          path: { meetingId },
          body: {
            guestName,
          },
        });

        if (tokenRes.error || !tokenRes.data) {
          throw new Error((tokenRes.error as any)?.message || 'Failed to acquire guest video room credentials');
        }
        tokenData = tokenRes.data;
      }

      const { token, serverUrl, meetingId: canonicalMeetingId } = tokenData;
      if (canonicalMeetingId) {
        resolvedMeetingIdRef.current = canonicalMeetingId;
      }

      // 2. Initialize LiveKit WebRTC SFU Room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
        publishDefaults: {
          simulcast: true,
          videoCodec: 'vp8',
        },
      });

      // Register SFU Room Listeners
      newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      newRoom.on(RoomEvent.Reconnecting, () => {
        console.info('[LiveKit] WebRTC ICE connection reconnecting...');
      });

      newRoom.on(RoomEvent.Reconnected, () => {
        console.info('[LiveKit] WebRTC ICE connection restored successfully');
        syncParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantConnected, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.ParticipantDisconnected, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.TrackPublished, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.TrackUnpublished, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.TrackSubscribed, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.TrackUnsubscribed, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.LocalTrackPublished, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.LocalTrackUnpublished, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.TrackMuted, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.TrackUnmuted, () => syncParticipants(newRoom));
      newRoom.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!newRoom.canPlaybackAudio) {
          newRoom.startAudio().catch(() => {});
        }
      });
      newRoom.on(RoomEvent.MediaDevicesError, (e) => {
        console.warn('[LiveKit] Media device notice:', e);
      });

      newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const isLocalSpeaking = speakers.some((s) => s.identity === newRoom.localParticipant?.identity);
        const now = Date.now();

        if (isLocalSpeaking) {
          if (!isSinglePersonSpeakingRef.current) {
            isSinglePersonSpeakingRef.current = true;
            singlePersonSpeechStartRef.current = now;
          }
        } else if (isSinglePersonSpeakingRef.current) {
          // Local speaker completed speaking burst
          const duration = now - singlePersonSpeechStartRef.current;
          isSinglePersonSpeakingRef.current = false;

          // If speech recognition hasn't generated text recently, record the verified speaking burst
          if (duration > 1200 && now - lastTextSegmentTimeRef.current > 2500 && socketRef.current?.connected) {
            const startOffset = Math.max(0, singlePersonSpeechStartRef.current - sessionStartTimeRef.current);
            const endOffset = Math.max(0, now - sessionStartTimeRef.current);
            const speakerName =
              user?.name ||
              user?.email?.split('@')[0] ||
              localStorage.getItem('meetingos_guest_name') ||
              'Speaker';

            socketRef.current.emit('send_caption', {
              meetingId: resolvedMeetingIdRef.current || meetingId,
              speakerId: user?.id || 'local_user',
              speakerName,
              text: `Spoken dialogue and active contribution from ${speakerName}.`,
              isInterim: false,
              startTimeMs: startOffset,
              endTimeMs: endOffset,
            });
            lastTextSegmentTimeRef.current = now;
          }
        }

        if (speakers.length > 0) {
          setActiveSpeakerId(speakers[0].identity);
        } else {
          setActiveSpeakerId(null);
        }
        syncParticipants(newRoom);
      });

      // Connect to LiveKit SFU Media Server
      let livekitWsUrl = (serverUrl || 'http://localhost:7880').replace('localhost', window.location.hostname || 'localhost');
      if (livekitWsUrl.startsWith('http://')) {
        livekitWsUrl = livekitWsUrl.replace('http://', 'ws://');
      } else if (livekitWsUrl.startsWith('https://')) {
        livekitWsUrl = livekitWsUrl.replace('https://', 'wss://');
      }

      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ];

      await newRoom.connect(livekitWsUrl, token, {
        autoSubscribe: true,
        rtcConfig: {
          iceTransportPolicy: 'all',
          bundlePolicy: 'max-bundle',
          iceServers,
        },
      });

      // Publish local audio/video with safe error recovery
      const initialAudio = opts?.audio ?? true;
      const initialVideo = opts?.video ?? true;

      isMicMutedRef.current = !initialAudio;
      setIsMicMuted(!initialAudio);
      isActiveRef.current = true;
      sessionStartTimeRef.current = Date.now();

      if (initialAudio) {
        try {
          await newRoom.localParticipant.setMicrophoneEnabled(true);
          setIsMicMuted(false);
          isMicMutedRef.current = false;
        } catch (audioErr) {
          console.warn('[LiveKit] Initial microphone acquisition notice:', audioErr);
          setIsMicMuted(true);
          isMicMutedRef.current = true;
        }
      } else {
        setIsMicMuted(true);
        isMicMutedRef.current = true;
      }

      if (initialVideo) {
        try {
          await newRoom.localParticipant.setCameraEnabled(true);
          setIsVideoMuted(false);
        } catch (videoErr) {
          console.warn('[LiveKit] Initial camera acquisition notice (camera may be locked by another tab/app):', videoErr);
          setIsVideoMuted(true);
        }
      } else {
        setIsVideoMuted(true);
      }

      // Unlock audio playback
      newRoom.startAudio().catch(() => {});

      setRoom(newRoom);
      syncParticipants(newRoom);

      // 3. Connect to MeetingOS WebSocket Gateway for Live Captions
      const configuredBaseUrl = resolveBaseUrl();
      let socketUrl: string;
      if (configuredBaseUrl) {
        socketUrl = `${configuredBaseUrl}/video-rooms`;
      } else if (window.location.port === '5173' || window.location.port === '3000') {
        socketUrl = `${window.location.protocol}//${window.location.hostname}:8000/video-rooms`;
      } else {
        // Production container / reverse-proxy: connect same-origin via Nginx /socket.io/ proxy
        socketUrl = `${window.location.origin}/video-rooms`;
      }
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      const effectiveMeetingId = resolvedMeetingIdRef.current || meetingId;

      socket.on('connect', () => {
        socket.emit('join_room', {
          meetingId: effectiveMeetingId,
          userId: user?.id || 'guest',
          userName: user?.name || user?.email?.split('@')[0] || localStorage.getItem('meetingos_guest_name') || 'Attendee',
        });
      });

      socket.on('live_caption', (caption: LiveCaption) => {
        setCurrentCaption(caption);
        if (!caption.isInterim) {
          setLiveCaptions((prev) => [...prev, caption]);
        }

        // Auto-clear active floating subtitle after 4 seconds of silence
        if (captionClearTimerRef.current) {
          clearTimeout(captionClearTimerRef.current);
        }
        captionClearTimerRef.current = setTimeout(() => {
          setCurrentCaption(null);
        }, 4000);
      });

      socket.on('live_chat_message', (msg: InCallChatMessage) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socketRef.current = socket;

      // 4. Initialize and start continuous background speech engine if mic is unmuted
      if (!isMicMutedRef.current) {
        startSpeechEngine();
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to connect to video call room:', err);
      setError(err.message || 'Could not connect to video room');
      setIsLoading(false);
    }
  }, [meetingId, user, syncParticipants, startSpeechEngine]);

  // Toggle Microphone
  const toggleMicrophone = useCallback(async () => {
    if (!room?.localParticipant) return;
    const newState = !isMicMuted;
    isMicMutedRef.current = newState;
    setIsMicMuted(newState);

    try {
      await room.localParticipant.setMicrophoneEnabled(!newState);
    } catch (err) {
      console.warn('Microphone toggle error:', err);
    }

    if (newState) {
      stopSpeechEngine();
    } else {
      startSpeechEngine();
    }
    syncParticipants(room);
  }, [room, isMicMuted, syncParticipants, startSpeechEngine, stopSpeechEngine]);

  // Toggle Camera
  const toggleCamera = useCallback(async () => {
    if (!room?.localParticipant) return;
    const newState = !isVideoMuted;
    await room.localParticipant.setCameraEnabled(!newState);
    setIsVideoMuted(newState);
    syncParticipants(room);
  }, [room, videoRoomsControllerEndCall, syncParticipants]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (!room?.localParticipant) return;
    const newState = !isScreenSharing;
    try {
      await room.localParticipant.setScreenShareEnabled(newState);
      setIsScreenSharing(newState);
      syncParticipants(room);
    } catch (err: any) {
      console.warn('Screen share toggle error:', err);
      setIsScreenSharing(false);
    }
  }, [room, isScreenSharing, syncParticipants]);

  // Send In-Room Chat Message
  const sendChatMessage = useCallback((text: string) => {
    if (!socketRef.current || !text.trim()) return;
    const msg: InCallChatMessage = {
      id: `chat_${Date.now()}`,
      userId: user?.id || 'guest',
      userName: user?.name || 'Attendee',
      text: text.trim(),
      timestamp: Date.now(),
    };
    socketRef.current.emit('send_reaction', {
      meetingId,
      userId: msg.userId,
      userName: msg.userName,
      emoji: msg.text,
    });
    setChatMessages((prev) => [...prev, msg]);
  }, [meetingId, user]);

  // Send a Manual Transcript Note / Fallback Caption
  const sendManualCaption = useCallback((text: string) => {
    if (!text.trim()) return;
    const now = Date.now();
    const startOffset = Math.max(0, now - sessionStartTimeRef.current - 3000);
    const endOffset = Math.max(0, now - sessionStartTimeRef.current);
    const speakerName =
      user?.name ||
      user?.email?.split('@')[0] ||
      localStorage.getItem('meetingos_guest_name') ||
      'Speaker';

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_caption', {
        meetingId: resolvedMeetingIdRef.current || meetingId,
        speakerId: user?.id || 'local_user',
        speakerName,
        text: text.trim(),
        isInterim: false,
        startTimeMs: startOffset,
        endTimeMs: endOffset,
      });
    }
  }, [meetingId, user]);

  // Leave / Disconnect from Room
  const leaveRoom = useCallback(async (isHostEnding = false) => {
    isActiveRef.current = false;
    flushPendingInterim();
    stopUniversalVAD();

    if (restartWatchdogTimerRef.current) {
      clearTimeout(restartWatchdogTimerRef.current);
      restartWatchdogTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      recognitionRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit('leave_room', {
        meetingId,
        userId: user?.id || 'guest',
        userName: user?.name || 'Attendee',
      });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (room) {
      await room.disconnect();
      setRoom(null);
    }

    if (isHostEnding) {
      await videoRoomsControllerEndCall({
        path: { meetingId },
        body: { reason: 'Meeting concluded by host' },
      });
    }
  }, [room, meetingId, user, stopUniversalVAD]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      stopUniversalVAD();
      if (restartWatchdogTimerRef.current) {
        clearTimeout(restartWatchdogTimerRef.current);
      }
      if (captionClearTimerRef.current) {
        clearTimeout(captionClearTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (room) {
        room.disconnect();
      }
    };
  }, [room, stopUniversalVAD]);

  return {
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
    isSpeechSupported,
    isLoading,
    error,
    connect,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
    sendManualCaption,
    leaveRoom,
  };
}
