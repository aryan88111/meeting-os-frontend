import React, { useState } from 'react';
import {
  RiCloseLine,
  RiFileCopyLine,
  RiCheckLine,
  RiUserAddLine,
  RiMailSendLine,
  RiShareLine,
  RiSparklingFill,
  RiGroupLine,
} from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { videoRoomsControllerAddParticipant } from '@/api';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
  participants: Array<{ id: string; name: string; email?: string; role?: string }>;
  onParticipantAdded?: (p: { name: string; email?: string; role?: string }) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  meetingId,
  meetingTitle,
  participants,
  onParticipantAdded,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFullInvite, setCopiedFullInvite] = useState(false);
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentInvitees, setRecentInvitees] = useState<Array<{ name: string; email?: string }>>([]);

  if (!isOpen) return null;

  const joinUrl = `${window.location.origin}/room/${meetingId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyFullInvitation = () => {
    const fullText = `You're invited to a MeetingOS Video Call:
📌 Meeting: ${meetingTitle || 'Live Video Conference'}
🔗 Join Link: ${joinUrl}
🔑 Room ID: ${meetingId}

Join from any browser with real-time AI live captions & speaker intelligence.`;

    navigator.clipboard.writeText(fullText);
    setCopiedFullInvite(true);
    setTimeout(() => setCopiedFullInvite(false), 2000);
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeName.trim()) return;

    setIsSubmitting(true);
    try {
      await videoRoomsControllerAddParticipant({
        path: { meetingId },
        body: {
          name: inviteeName.trim(),
          email: inviteeEmail.trim() || undefined,
          role: 'ATTENDEE',
        },
      });

      const newInvitee = { name: inviteeName.trim(), email: inviteeEmail.trim() || undefined };
      setRecentInvitees((prev) => [...prev, newInvitee]);
      onParticipantAdded?.(newInvitee);
      setInviteeName('');
      setInviteeEmail('');
    } catch (err) {
      console.warn('Failed to add participant:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden z-10 flex flex-col text-card-foreground">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <RiShareLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Share Meeting & Add People</h3>
              <p className="text-xs text-muted-foreground">Invite anyone with link or email to join this call</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Direct Link Box */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground">Direct Meeting Link</label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-secondary/50 border border-border">
              <input
                type="text"
                readOnly
                value={joinUrl}
                className="flex-1 bg-transparent text-xs text-foreground px-2 outline-none select-all font-mono truncate"
              />
              <Button
                variant="default"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 text-xs font-semibold cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <span className="flex items-center gap-1 text-emerald-300">
                    <RiCheckLine className="w-3.5 h-3.5" /> Copied!
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <RiFileCopyLine className="w-3.5 h-3.5" /> Copy Link
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Copy Full Invitation Button */}
          <div>
            <button
              onClick={handleCopyFullInvitation}
              className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-medium text-secondary-foreground flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copiedFullInvite ? (
                <span className="text-emerald-500 flex items-center gap-1.5 font-semibold">
                  <RiCheckLine className="w-4 h-4" /> Invitation Copied to Clipboard
                </span>
              ) : (
                <>
                  <RiMailSendLine className="w-4 h-4 text-primary" />
                  <span>Copy Full Invitation (for Slack, Email, WhatsApp)</span>
                </>
              )}
            </button>
          </div>

          <div className="w-full h-px bg-border my-1" />

          {/* Add Attendee Form */}
          <form onSubmit={handleAddParticipant} className="space-y-3">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <RiUserAddLine className="w-3.5 h-3.5 text-primary" />
              <span>Add Participant to Roster</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value)}
                placeholder="Full Name *"
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <input
                type="email"
                value={inviteeEmail}
                onChange={(e) => setInviteeEmail(e.target.value)}
                placeholder="Email Address (optional)"
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !inviteeName.trim()}
              className="w-full h-8 text-xs font-semibold cursor-pointer"
            >
              <RiUserAddLine className="w-3.5 h-3.5 mr-1.5" />
              {isSubmitting ? 'Adding...' : 'Add Attendee'}
            </Button>
          </form>

          {/* Recently Added or Current Participants */}
          {(recentInvitees.length > 0 || participants.length > 0) && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Meeting Attendees ({participants.length + recentInvitees.length})
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border text-xs">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{p.email || 'Guest'}</span>
                  </div>
                ))}
                {recentInvitees.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                    <span className="font-medium text-primary">{p.name} (Just Added)</span>
                    <span className="text-[10px] text-primary/80">{p.email || 'Attendee'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
