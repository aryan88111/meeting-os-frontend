import React, { useState } from 'react';
import {
  RiCloseLine,
  RiVideoChatLine,
  RiCalendarEventLine,
  RiTimeLine,
  RiUserAddLine,
  RiDeleteBin6Line,
  RiLinkM,
  RiSparklingFill,
  RiLoader4Line,
  RiTeamLine,
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { SiZoom } from 'react-icons/si';
import {
  integrationsControllerListIntegrations,
  meetingsControllerCreateMeeting,
} from '@/api';
import { useAuthStore } from '@/stores/auth.store';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: string; // YYYY-MM-DD
}

interface ParticipantEntry {
  name: string;
  email: string;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
}) => {
  const { loginWithOAuth } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState<'GOOGLE_MEET' | 'ZOOM' | 'MICROSOFT_TEAMS' | 'MANUAL'>('GOOGLE_MEET');
  const [autoGenerateLink, setAutoGenerateLink] = useState(true);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:30');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [participants, setParticipants] = useState<ParticipantEntry[]>([
    { name: '', email: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleAccount, setGoogleAccount] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<'ACTIVE' | 'AUTH_REQUIRED' | 'DISCONNECTED' | 'LOADING'>('LOADING');

  // Check if Google is connected
  React.useEffect(() => {
    if (isOpen) {
      integrationsControllerListIntegrations()
        .then((res) => {
          if (res.data) {
            const data = res.data as any;
            const g = (data.integrations || []).find((i: any) => i.provider === 'GOOGLE_MEET');
            if (g) {
              setGoogleAccount(g.account || 'Connected');
              setGoogleStatus(g.status === 'ACTIVE' ? 'ACTIVE' : 'AUTH_REQUIRED');
            } else {
              setGoogleStatus('DISCONNECTED');
            }
          }
        })
        .catch(() => {
          setGoogleStatus('DISCONNECTED');
        });
    }
  }, [isOpen]);

  const handleConnectGoogle = async () => {
    setError(null);
    try {
      await loginWithOAuth('google');
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate Google Calendar connection');
    }
  };

  if (!isOpen) return null;

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: '', email: '' }]);
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleParticipantChange = (
    index: number,
    field: 'name' | 'email',
    value: string,
  ) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Please provide a meeting title');
      return;
    }

    setIsLoading(true);

    try {
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

      const validParticipants = participants
        .filter((p) => p.name.trim() || p.email.trim())
        .map((p) => ({
          name: p.name.trim() || p.email.split('@')[0],
          email: p.email.trim() || undefined,
        }));

      const response = await meetingsControllerCreateMeeting({
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          provider: provider as any,
          meetingUrl: autoGenerateLink ? undefined : meetingUrl.trim() || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          durationSeconds: durationMinutes * 60,
          participants: validParticipants.length ? validParticipants : undefined,
        },
      });

      if (response.error) {
        const errData = response.error as any;
        throw new Error(errData?.message || 'Failed to create meeting session');
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while scheduling meeting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <RiCalendarEventLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Schedule & Link Meeting</h3>
              <p className="text-xs text-muted-foreground">Attach video call links, set schedule, and invite team members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border/70 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground/90">Meeting Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Architecture & Sprint Kickoff"
              className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs outline-none transition"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground/90">Objective & Agenda <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context on topics to discuss..."
              className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs outline-none transition resize-none"
            />
          </div>

          {/* Platform / Provider Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground/90">Meeting Platform</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setProvider('GOOGLE_MEET')}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition ${
                  provider === 'GOOGLE_MEET'
                    ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <FcGoogle className="w-4 h-4" />
                <span>Meet</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider('ZOOM')}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition ${
                  provider === 'ZOOM'
                    ? 'border-blue-500 bg-blue-500/10 text-foreground font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <SiZoom className="w-4 h-4 text-blue-500" />
                <span>Zoom</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider('MICROSOFT_TEAMS')}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition ${
                  provider === 'MICROSOFT_TEAMS'
                    ? 'border-purple-500 bg-purple-500/10 text-foreground font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <RiTeamLine className="w-4 h-4 text-purple-500" />
                <span>Teams</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider('MANUAL')}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition ${
                  provider === 'MANUAL'
                    ? 'border-foreground/30 bg-muted text-foreground font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <RiVideoChatLine className="w-4 h-4" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Auto Generate Link Option & Manual Override */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/80">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                <RiSparklingFill className="w-3.5 h-3.5 text-primary" />
                <span>Auto-Generate Video Call Link</span>
              </label>
              <input
                type="checkbox"
                checked={autoGenerateLink}
                onChange={(e) => setAutoGenerateLink(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer accent-primary"
              />
            </div>

            {autoGenerateLink ? (
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {provider === 'GOOGLE_MEET' && (
                    googleStatus === 'ACTIVE'
                      ? `✓ Publishing to your Google Calendar (${googleAccount}) with genuine Google Meet room & attendee invitations.`
                      : '⚡ Connect your Google Calendar below to create official Google Meet rooms and dispatch Calendar invitations.'
                  )}
                  {provider === 'ZOOM' && '⚡ MeetingOS will automatically provision a Zoom meeting ID with security passcode.'}
                  {provider === 'MICROSOFT_TEAMS' && '⚡ MeetingOS will generate an official Microsoft Teams join link.'}
                  {provider === 'MANUAL' && '⚡ MeetingOS will generate a persistent shared room so all attendees join the same call.'}
                </p>

                {provider === 'GOOGLE_MEET' && googleStatus === 'ACTIVE' && (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                    ✓ Google Calendar Connected & Active
                  </span>
                )}

                {provider === 'GOOGLE_MEET' && googleStatus === 'AUTH_REQUIRED' && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2">
                    <span className="text-amber-700 dark:text-amber-400 text-[11px]">
                      Google session expired. Reconnect to generate official Google Meet links.
                    </span>
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-90 transition whitespace-nowrap"
                    >
                      Reconnect Google
                    </button>
                  </div>
                )}

                {provider === 'GOOGLE_MEET' && googleStatus === 'DISCONNECTED' && (
                  <div className="p-2 rounded-lg bg-muted border border-border text-xs flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-[11px]">
                      Google Calendar not connected.
                    </span>
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-90 transition whitespace-nowrap"
                    >
                      Connect Google
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-1.5 space-y-1">
                <div className="relative">
                  <RiLinkM className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz or custom join link"
                    className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Schedule Date, Time & Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground/90">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground/90">Start Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground/90">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs outline-none"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          {/* Attendees / Participants */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground/90">Participants / Attendees</label>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <RiUserAddLine className="w-3.5 h-3.5" />
                <span>Add Attendee</span>
              </button>
            </div>

            <div className="space-y-2">
              {participants.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleParticipantChange(idx, 'name', e.target.value)}
                    placeholder="Full Name"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs outline-none"
                  />
                  <input
                    type="email"
                    value={p.email}
                    onChange={(e) => handleParticipantChange(idx, 'email', e.target.value)}
                    placeholder="email@company.com"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs outline-none"
                  />
                  {participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(idx)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    >
                      <RiDeleteBin6Line className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit Action */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted/50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/25 hover:opacity-90 active:scale-[0.99] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <RiSparklingFill className="w-3.5 h-3.5" />
                  <span>Schedule Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
