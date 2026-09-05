import React, { useState } from 'react';
import {
  RiDeleteBin6Line,
  RiCloseLine,
  RiLoader4Line,
  RiAlertLine,
  RiCalendarCheckLine,
} from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import { meetingsControllerDeleteMeeting } from '@/api';

interface DeleteMeetingModalProps {
  isOpen: boolean;
  meetingId: string | null;
  meetingTitle: string;
  provider?: string;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteMeetingModal: React.FC<DeleteMeetingModalProps> = ({
  isOpen,
  meetingId,
  meetingTitle,
  provider,
  onClose,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !meetingId) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await meetingsControllerDeleteMeeting({
        path: { id: meetingId },
      });

      if (response.error) {
        const errData = response.error as any;
        throw new Error(errData?.message || 'Failed to delete meeting');
      }

      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting the meeting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive font-bold text-base">
            <RiDeleteBin6Line className="w-5 h-5" />
            <span>Delete Meeting</span>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground font-medium">
            Are you sure you want to delete <span className="font-bold text-destructive underline decoration-dotted">{meetingTitle}</span>?
          </p>

          <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 text-xs text-muted-foreground">
            {provider === 'GOOGLE_MEET' ? (
              <div className="flex items-start gap-2 text-foreground/90">
                <FcGoogle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This meeting will be removed from your <strong>Google Calendar</strong> and all attendee invites.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-foreground/90">
                <RiCalendarCheckLine className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span>This meeting will be removed from your active schedule.</span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground/80">
              Note: Historical transcript data and AI intelligence will be safely archived in MeetingOS.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <RiAlertLine className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs h-8 shadow-xs bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <RiLoader4Line className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <RiDeleteBin6Line className="w-3.5 h-3.5 mr-1.5" />
                Delete Meeting
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
