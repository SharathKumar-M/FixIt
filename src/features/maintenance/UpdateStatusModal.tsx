import React, { useState } from 'react';
import { Modal, Button, Textarea, Select } from '@/components/ui';
import { updateTicketStatus } from '@/api/fixit.api';
import type { Ticket } from '@/api/types';

export interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  targetStatus?: 'open' | 'resolved';
  onSuccess: (updated: Ticket) => void;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  ticket,
  targetStatus: initialTarget,
  onSuccess,
}) => {
  const [status, setStatus] = useState<'open' | 'resolved'>(
    initialTarget || (ticket.status === 'resolved' ? 'open' : 'resolved')
  );
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMsg('A brief maintenance note is mandatory for every status change.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const updated = await updateTicketStatus(ticket.id, {
        status,
        note: note.trim(),
      });
      onSuccess(updated);
      onClose();
      setNote('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update ticket status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResolving = status === 'resolved';
  const isReopening = status === 'open' && ticket.status === 'resolved';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isResolving
          ? 'Mark Ticket as Resolved'
          : isReopening
          ? 'Reopen Maintenance Ticket'
          : 'Post Maintenance Progress Update'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={isResolving ? 'primary' : 'secondary'}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {isResolving ? 'Confirm Resolution' : isReopening ? 'Reopen Ticket' : 'Post Update Note'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {errorMsg && (
          <div style={{ color: 'var(--status-overdue-text)', fontSize: '0.8125rem' }}>
            {errorMsg}
          </div>
        )}

        <Select
          label="Target Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'open' | 'resolved')}
          options={[
            { value: 'open', label: 'Open (In Progress / Progress Note)' },
            { value: 'resolved', label: 'Resolved (Repair Completed)' },
          ]}
          required
        />

        <Textarea
          label="Maintenance Note (Mandatory)"
          placeholder={
            isResolving
              ? 'Specify the actions taken to repair this issue, parts replaced, or inspection findings...'
              : isReopening
              ? 'Explain why this ticket is being reopened for further maintenance...'
              : 'Add an operational progress note on technician dispatch or parts ordered...'
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          required
          helperText="This note is permanently recorded on the ticket and visible to the reporter."
        />
      </form>
    </Modal>
  );
};
