import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangleIcon } from '../icons';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div
          style={{
            padding: '0.625rem',
            borderRadius: '50%',
            backgroundColor: variant === 'danger' ? 'var(--status-overdue-bg)' : 'var(--color-electric-blue-light)',
            color: variant === 'danger' ? 'var(--status-overdue-text)' : 'var(--color-electric-blue)',
            flexShrink: 0,
          }}
        >
          <AlertTriangleIcon size={24} />
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5, marginTop: '0.25rem' }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};
