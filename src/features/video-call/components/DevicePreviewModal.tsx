import React, { useState, useEffect, useRef } from 'react';
import {
  RiCameraLine,
  RiCameraOffLine,
  RiMicLine,
  RiMicOffLine,
  RiVideoChatLine,
  RiSparklingFill,
  RiArrowRightLine,
  RiUserAddLine,
  RiLoginBoxLine,
  RiUserLine,
  RiCheckLine,
  RiShieldCheckLine,
  RiArrowLeftLine,
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { FiGithub } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

const MicrosoftIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1H1V10H10V1Z" fill="#F25022" />
    <path d="M20 1H11V10H20V1Z" fill="#7FBA00" />
    <path d="M10 11H1V20H10V11Z" fill="#00A4EF" />
    <path d="M20 11H11V20H20V11Z" fill="#FFB900" />
  </svg>
);

interface DevicePreviewModalProps {
  meetingTitle: string;
  onJoin: (options: { audio: boolean; video: boolean }) => void;
  onCancel: () => void;
}

export const DevicePreviewModal: React.FC<DevicePreviewModalProps> = ({
  meetingTitle,
  onJoin,
  onCancel,
}) => {
  const {
    user,
    token,
    isAuthenticated,
    register,
    login,
    loginWithOAuth,
    fetchProfile,
    isLoading: isAuthLoading,
    error: authError,
    clearError,
  } = useAuthStore();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [micVolume, setMicVolume] = useState(0);

  // Invitee Account Onboarding state (when unauthenticated)
  const [authTab, setAuthTab] = useState<'register' | 'login' | 'guest'>('register');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [guestName, setGuestName] = useState(localStorage.getItem('meetingos_guest_name') || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile]);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function setupPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoPreviewRef.current && isVideoEnabled) {
          videoPreviewRef.current.srcObject = stream;
        }

        // Setup microphone volume level analyzer
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!active) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolume(isAudioEnabled ? Math.min(100, Math.round(avg * 1.5)) : 0);
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        console.warn('Device preview notice (mic/camera access):', err);
      }
    }

    setupPreview();

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [isVideoEnabled]);

  const handleToggleAudio = () => {
    setIsAudioEnabled((prev) => !prev);
  };

  const handleToggleVideo = () => {
    setIsVideoEnabled((prev) => !prev);
  };

  const stopPreviewTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const handleJoinCall = () => {
    stopPreviewTracks();
    onJoin({ audio: isAudioEnabled, video: isVideoEnabled });
  };

  const handleRegisterAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setFormError('Please fill in your name, email, and password.');
      return;
    }

    if (regPassword.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(regName.trim(), regEmail.trim(), regPassword);
      handleJoinCall();
    } catch (err: any) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setFormError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      handleJoinCall();
    } catch (err: any) {
      setFormError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'azure') => {
    sessionStorage.setItem('meetingos_redirect_after_auth', window.location.pathname);
    setOauthLoading(provider);
    setFormError(null);
    clearError();
    try {
      await loginWithOAuth(provider);
    } catch (err: any) {
      setFormError(err.message || `Failed to sign in with ${provider}`);
      setOauthLoading(null);
    }
  };

  const handleGuestJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGuestName = guestName.trim() || `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('meetingos_guest_name', finalGuestName);
    handleJoinCall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-2xl animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-4xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
              title="Cancel and Exit"
            >
              <RiArrowLeftLine className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <RiVideoChatLine className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-foreground truncate">Meeting Ready Room</h3>
              <p className="text-xs text-muted-foreground truncate">{meetingTitle || 'Video Conference'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl font-medium">
              <RiSparklingFill className="w-3.5 h-3.5 animate-pulse" />
              <span>SFU Live Diarization</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 overflow-y-auto">
          {/* Left Column: Video Studio & Microphone VU Level */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative w-full aspect-video bg-muted/40 rounded-2xl sm:rounded-3xl overflow-hidden border border-border flex items-center justify-center shadow-inner">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
                  isVideoEnabled ? 'opacity-100' : 'opacity-0 absolute'
                }`}
              />

              {!isVideoEnabled && (
                <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                  <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground shadow-lg">
                    <RiCameraOffLine className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    <p className="text-xs font-medium text-foreground">Camera is turned off</p>
                  </div>
                </div>
              )}

              {/* In-preview Floating Apple-style Quick Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-card/90 backdrop-blur-2xl px-3 py-1.5 rounded-2xl border border-border shadow-2xl z-20">
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isAudioEnabled
                      ? 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/80'
                      : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25 ring-2 ring-destructive/30'
                  }`}
                  title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isAudioEnabled ? <RiMicLine className="w-4 h-4 text-emerald-500" /> : <RiMicOffLine className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isVideoEnabled
                      ? 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/80'
                      : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25 ring-2 ring-destructive/30'
                  }`}
                  title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {isVideoEnabled ? <RiCameraLine className="w-4 h-4" /> : <RiCameraOffLine className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Dynamic Microphone VU Meter */}
            <div className="flex items-center gap-3.5 bg-muted/30 p-3.5 rounded-2xl border border-border">
              <div className="text-xs font-medium text-foreground flex items-center gap-2 shrink-0">
                <span className={`w-2 h-2 rounded-full ${micVolume > 5 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                <RiMicLine className="w-4 h-4 text-primary" />
                <span>Microphone VU:</span>
              </div>
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-75 rounded-full shadow-xs"
                  style={{ width: `${micVolume}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground w-9 text-right font-medium">
                {micVolume}%
              </span>
            </div>
          </div>

          {/* Right Column: Authenticated Roster or Invitee Onboarding */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {isAuthenticated && user ? (
              <div className="h-full flex flex-col justify-between space-y-5 bg-muted/30 p-6 rounded-3xl border border-border/80">
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-primary/30 to-purple-500/30 border border-primary/30 flex items-center justify-center text-foreground font-bold text-lg shadow-inner">
                      {user.name?.slice(0, 2).toUpperCase() || 'ME'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-foreground truncate">{user.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-semibold mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <RiCheckLine className="w-3.5 h-3.5" />
                        Host / Member
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-background border border-border/70 text-xs text-muted-foreground leading-relaxed space-y-1.5">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <RiSparklingFill className="w-3.5 h-3.5 text-primary" />
                      Auto-Intelligence Enabled
                    </p>
                    <p>
                      Your voice will be diarized under your profile. Real-time recording and AI summaries will be saved directly into your workspace dashboard.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleJoinCall}
                  className="w-full h-12 text-sm font-bold shadow-xl shadow-primary/25 rounded-2xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Join Meeting Now</span>
                  <RiArrowRightLine className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Onboarding Tabs */}
                <div className="flex rounded-2xl bg-muted/50 p-1 border border-border/60">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setFormError(null); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      authTab === 'register'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <RiUserAddLine className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setFormError(null); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      authTab === 'login'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <RiLoginBoxLine className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('guest'); setFormError(null); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      authTab === 'guest'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <RiUserLine className="w-3.5 h-3.5" />
                    <span>Guest</span>
                  </button>
                </div>

                {(formError || authError) && (
                  <div className="p-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs">
                    {formError || authError}
                  </div>
                )}

                {/* Social 1-Click OAuth Buttons */}
                {authTab !== 'guest' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={isSubmitting || isAuthLoading || oauthLoading !== null}
                        onClick={() => handleOAuth('google')}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        title="Sign in with Google"
                      >
                        <FcGoogle className="w-4 h-4 shrink-0" />
                        <span>Google</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || isAuthLoading || oauthLoading !== null}
                        onClick={() => handleOAuth('azure')}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        title="Sign in with Microsoft"
                      >
                        <MicrosoftIcon className="w-4 h-4 shrink-0" />
                        <span>Microsoft</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || isAuthLoading || oauthLoading !== null}
                        onClick={() => handleOAuth('github')}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        title="Sign in with GitHub"
                      >
                        <FiGithub className="w-4 h-4 shrink-0" />
                        <span>GitHub</span>
                      </button>
                    </div>

                    <div className="relative flex items-center justify-center py-1">
                      <div className="border-t border-border w-full" />
                      <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold absolute">
                        or with email
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab 1: Create Account & Join */}
                {authTab === 'register' && (
                  <form onSubmit={handleRegisterAndJoin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Full Name</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Sarah Connor"
                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Email Address</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Create Password (min 8 chars)</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || isAuthLoading || oauthLoading !== null}
                      className="w-full h-11 text-xs font-bold shadow-lg shadow-primary/25 rounded-xl cursor-pointer mt-2"
                    >
                      <span>{isSubmitting || isAuthLoading ? 'Creating Account & Joining...' : 'Create Account & Join Call'}</span>
                      <RiArrowRightLine className="w-4 h-4 ml-1.5" />
                    </Button>
                  </form>
                )}

                {/* Tab 2: Sign In & Join */}
                {authTab === 'login' && (
                  <form onSubmit={handleLoginAndJoin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Email Address</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Password</label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || isAuthLoading}
                      className="w-full h-11 text-xs font-bold shadow-lg shadow-primary/25 rounded-xl cursor-pointer mt-2"
                    >
                      <span>{isSubmitting || isAuthLoading ? 'Signing In & Joining...' : 'Sign In & Join Call'}</span>
                      <RiArrowRightLine className="w-4 h-4 ml-1.5" />
                    </Button>
                  </form>
                )}

                {/* Tab 3: Quick Guest Join */}
                {authTab === 'guest' && (
                  <form onSubmit={handleGuestJoin} className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Join as a guest without signing in (your name will appear on the transcript):
                    </p>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Your Display Name</label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Guest Name"
                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-xs font-bold shadow-lg shadow-primary/25 rounded-xl cursor-pointer mt-2"
                    >
                      <span>Continue as Guest</span>
                      <RiArrowRightLine className="w-4 h-4 ml-1.5" />
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-muted/20">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground text-xs font-medium cursor-pointer"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <RiShieldCheckLine className="w-3.5 h-3.5 text-emerald-500" />
            <span>End-to-End Encrypted SFU Stream with Real-time AI Diarization</span>
          </div>
        </div>
      </div>
    </div>
  );
};
