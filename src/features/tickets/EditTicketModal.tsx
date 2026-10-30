import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';
import { getIssueTypes, updateTicket } from '@/api/fixit.api';
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/api/config';
import type { Ticket, IssueType } from '@/api/types';
import { UploadIcon, TrashIcon, ImageIcon, RefreshIcon, AlertCircleIcon } from '@/components/icons';
import { formatFileSize } from '@/utils/format';

export interface EditTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSuccess: (updated: Ticket) => void;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onSuccess,
}) => {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [issueTypeId, setIssueTypeId] = useState(ticket.issue_type_id);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);

  // Photo state
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | undefined>(ticket.photo_url);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setTitle(ticket.title);
    setDescription(ticket.description);
    setIssueTypeId(ticket.issue_type_id);
    setCurrentPhotoUrl(ticket.photo_url);
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
    setIsPhotoRemoved(false);
    setPhotoError(null);
    setErrorMsg(null);

    async function loadTypes() {
      try {
        const types = await getIssueTypes();
        setIssueTypes(types);
      } catch {
        // noop
      }
    }
    if (isOpen) {
      loadTypes();
    }
  }, [ticket, isOpen]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setPhotoError(`Image size exceeds maximum limit of ${MAX_UPLOAD_SIZE_MB}MB.`);
      return;
    }

    setPhotoError(null);
    setNewPhotoFile(file);
    setIsPhotoRemoved(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
    setIsPhotoRemoved(true);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestorePhoto = () => {
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
    setIsPhotoRemoved(false);
    setPhotoError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Title and description cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        issue_type_id: issueTypeId,
      };

      if (newPhotoFile) {
        payload.photo = newPhotoFile;
      } else if (isPhotoRemoved) {
        payload.remove_photo = true;
      }

      const updated = await updateTicket(ticket.id, payload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which photo is shown
  const activeDisplayPhoto = newPhotoPreview || (!isPhotoRemoved ? currentPhotoUrl : null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Maintenance Ticket"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--status-overdue-bg)',
              border: '1px solid var(--status-overdue-border)',
              color: 'var(--status-overdue-text)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircleIcon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <Select
          label="Category"
          value={issueTypeId}
          onChange={(e) => setIssueTypeId(e.target.value)}
          options={issueTypes.map((t) => ({ value: t.id, label: t.name }))}
          required
        />

        <Input
          label="Issue Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief title of the issue"
          required
        />

        <Textarea
          label="Description & Location"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue and specify room/building location..."
          rows={3}
          required
        />

        {/* Photo Management Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Issue Photograph
          </label>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
          />

          {activeDisplayPhoto ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 72,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#0B132B',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <img
                  src={activeDisplayPhoto}
                  alt="Issue preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {newPhotoFile ? newPhotoFile.name : 'Attached photograph'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {newPhotoFile
                    ? `New photo selected (${formatFileSize(newPhotoFile.size)})`
                    : 'Currently uploaded photo on this ticket'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<UploadIcon size={14} />}
                  >
                    Replace Photo
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleRemovePhoto}
                    icon={<TrashIcon size={14} />}
                  >
                    Delete Photo
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '2px dashed var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: isPhotoRemoved ? 'var(--status-overdue-bg)' : 'var(--color-bg-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-electric-blue)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <ImageIcon size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {isPhotoRemoved ? 'Photo Marked for Deletion' : 'No Photo Attached — Click to Upload'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {isPhotoRemoved
                    ? 'Click to upload a replacement photo, or save to confirm removal.'
                    : `JPEG, PNG, WebP up to ${MAX_UPLOAD_SIZE_MB}MB`}
                </span>
                {isPhotoRemoved && currentPhotoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    style={{ marginTop: '0.25rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestorePhoto();
                    }}
                    icon={<RefreshIcon size={14} />}
                  >
                    Restore Original Photo
                  </Button>
                )}
              </div>
            </div>
          )}

          {photoError && (
            <span style={{ fontSize: '0.75rem', color: 'var(--status-overdue-text)' }}>
              {photoError}
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
};
