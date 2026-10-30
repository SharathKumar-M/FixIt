import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { updateTicketTAT } from '@/api/fixit.api';
import type { Ticket } from '@/api/types';
import { getTodayDateString } from '@/utils/date';

export interface UpdateTATModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSuccess: (updated: Ticket) => void;
}

export const UpdateTATModal: React.FC<UpdateTATModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onSuccess,
}) => {
  const [expectedBy, setExpectedBy] = useState(ticket.expected_by || getTodayDateString());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedBy) {
      setErrorMsg('Please select a target turnaround completion date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const updated = await updateTicketTAT(ticket.id, {
        expected_by: expectedBy,
        note: note.trim() || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update SLA deadline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Turnaround Target (TAT)"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            Confirm Deadline
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

        <Input
          label="Target Completion Date (expected_by)"
          type="date"
          value={expectedBy}
          onChange={(e) => setExpectedBy(e.target.value)}
          min={getTodayDateString()}
          required
          helperText="Expected completion date format YYYY-MM-DD"
        />

        <Textarea
          label="Operational Note (Optional)"
          placeholder="e.g. Parts dispatched by vendor; technician scheduled for installation on target date..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </form>
    </Modal>
  );
};
