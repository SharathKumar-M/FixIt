import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import styles from './TicketDetailPage.module.css';
import { getTicketById, deleteTicket, acknowledgeTicket, updateTicket } from '@/api/fixit.api';
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/api/config';
import type { Ticket } from '@/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import {
  Button,
  Badge,
  StatusTimeline,
  ConfirmDialog,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import {
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  AlertTriangleIcon,
  WrenchIcon,
  UserIcon,
  UploadIcon,
  ImageIcon,
  EyeIcon,
  XIcon,
} from '@/components/icons';
import { formatDateToIST, formatDateOnlyIST } from '@/utils/date';
import { EditTicketModal } from './EditTicketModal';
import { UpdateStatusModal } from '../maintenance/UpdateStatusModal';
import { UpdateTATModal } from '../maintenance/UpdateTATModal';

export const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user, isMaintenanceStaff, isAdmin } = useAuth();
  const toast = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletePhotoConfirmOpen, setIsDeletePhotoConfirmOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<'open' | 'resolved'>('resolved');
  const [isTATModalOpen, setIsTATModalOpen] = useState(false);

  // Lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Photo Uploading State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Action loadings
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const fetchTicket = async (signal?: AbortSignal) => {
    if (!ticketId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getTicketById(ticketId, signal);
      setTicket(data);
    } catch (err: any) {
      if (err?.code !== 'ABORTED') {
        setErrorMsg(err?.message || 'Could not find or retrieve the requested maintenance ticket.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTicket(controller.signal);
    return () => controller.abort();
  }, [ticketId]);

  // Handle Reporter Deleting / Withdrawing Ticket
  const handleDeleteTicket = async () => {
    if (!ticket) return;
    setIsDeleting(true);
    try {
      await deleteTicket(ticket.id);
      toast.success('Ticket Withdrawn', 'Your maintenance ticket has been removed.');
      navigate('/tickets', { replace: true });
    } catch (err: any) {
      toast.error('Withdraw Failed', err?.message || 'Failed to delete ticket.');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Handle Direct Photo Upload / Replace from Details Page
  const handleDirectPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ticket) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid Format', 'Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error('File Too Large', `Image size exceeds the ${MAX_UPLOAD_SIZE_MB}MB limit.`);
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const updated = await updateTicket(ticket.id, {
        photo: file,
      });
      setTicket(updated);
      toast.success('Photo Updated', 'Issue photograph has been attached successfully.');
    } catch (err: any) {
      toast.error('Upload Failed', err?.message || 'Could not update photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Handle Direct Photo Deletion
  const handleDeletePhoto = async () => {
    if (!ticket) return;
    setIsDeletingPhoto(true);
    try {
      const updated = await updateTicket(ticket.id, {
        remove_photo: true,
      });
      setTicket(updated);
      toast.success('Photo Deleted', 'The photograph was removed from this ticket.');
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not remove photo.');
    } finally {
      setIsDeletingPhoto(false);
      setIsDeletePhotoConfirmOpen(false);
    }
  };

  // Handle Reporter Acknowledging Resolved Ticket
  const handleAcknowledge = async () => {
    if (!ticket) return;
    setIsAcknowledging(true);
    try {
      const updated = await acknowledgeTicket(ticket.id);
      setTicket(updated);
      toast.success('Resolution Acknowledged', 'Thank you for confirming resolution of this issue.');
    } catch (err: any) {
      toast.error('Acknowledgement Failed', err?.message || 'Failed to acknowledge ticket.');
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Skeleton width={120} height={36} />
          <Skeleton width={160} height={28} />
        </div>
        <Skeleton width="100%" height={120} borderRadius={16} />
        <Skeleton width="100%" height={320} borderRadius={16} />
      </div>
    );
  }

  if (errorMsg || !ticket) {
    return (
      <div className={styles.container}>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeftIcon size={14} />}>
          Back
        </Button>
        <EmptyState
          icon={<AlertTriangleIcon size={32} />}
          title="Ticket Not Found"
          description={errorMsg || 'The requested ticket does not exist or you do not have permission to view it.'}
          action={
            <Button variant="primary" onClick={() => navigate('/tickets')}>
              Go to Ticket List
            </Button>
          }
        />
      </div>
    );
  }

  const categoryName = typeof ticket.issue_type === 'object' && ticket.issue_type !== null
    ? ticket.issue_type.name
    : ticket.issue_type || 'General Maintenance';

  const isOwner = Boolean(
    user && (ticket.reporter_id === user.id || ticket.reporter_email === user.email || !ticket.reporter_id)
  );

  const isOpen = ticket.status === 'open';
  const isResolved = ticket.status === 'resolved';

  return (
    <div className={styles.container}>
      {/* Top Bar with Navigation & Contextual Actions */}
      <div className={styles.topBar}>
        <div className={styles.ticketIdentity}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            icon={<ArrowLeftIcon size={14} />}
          >
            Back
          </Button>
          <span className={styles.ticketId}>#{ticket.id.slice(-6).toUpperCase()}</span>
          <Badge variant="category">{categoryName}</Badge>
          {ticket.overdue && <Badge variant="overdue">Overdue</Badge>}
        </div>

        <div className={styles.actionsGroup}>
          {/* Reporter Actions */}
          {isOpen && (isOwner || !isMaintenanceStaff) && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                icon={<EditIcon size={14} />}
              >
                Edit Ticket
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
                icon={<TrashIcon size={14} />}
              >
                Withdraw Ticket
              </Button>
            </>
          )}

          {isResolved && (isOwner || !isMaintenanceStaff) && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAcknowledge}
              loading={isAcknowledging}
              icon={<CheckCircleIcon size={16} />}
            >
              Acknowledge Resolution
            </Button>
          )}

          {/* Maintenance Staff Actions */}
          {isMaintenanceStaff && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTATModalOpen(true)}
                icon={<CalendarIcon size={14} />}
              >
                Set TAT Deadline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusTarget('open');
                  setIsStatusModalOpen(true);
                }}
                icon={<ClockIcon size={14} />}
              >
                Add Progress Note
              </Button>
              {isOpen ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setStatusTarget('resolved');
                    setIsStatusModalOpen(true);
                  }}
                  icon={<CheckCircleIcon size={14} />}
                >
                  Mark as Resolved
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusTarget('open');
                    setIsStatusModalOpen(true);
                  }}
                  icon={<WrenchIcon size={14} />}
                >
                  Reopen Ticket
                </Button>
              )}
            </>
          )}

          {/* Admin Deletion Action */}
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteConfirmOpen(true)}
              icon={<TrashIcon size={14} />}
            >
              Delete (Admin)
            </Button>
          )}
        </div>
      </div>

      {/* Visual Status Lifecycle Bar */}
      <StatusTimeline
        status={ticket.status}
        createdAt={ticket.created_at}
        resolvedAt={ticket.resolved_at}
        acknowledgedAt={ticket.acknowledged_at}
      />

      {/* Main Ticket Layout */}
      <div className={styles.grid}>
        {/* Left Card: Core Information */}
        <section className={styles.mainCard}>
          <div className={styles.titleHeader}>
            <h1 className={styles.title}>{ticket.title}</h1>
            <div className={styles.metaRow}>
              <span>Reported {formatDateToIST(ticket.created_at)}</span>
              {ticket.reporter_name && <span>By {ticket.reporter_name}</span>}
              {ticket.updated_at && (
                <span>• Updated {formatDateToIST(ticket.updated_at)}</span>
              )}
            </div>
          </div>

          <div className={styles.descriptionBox}>
            <span className={styles.sectionLabel}>Problem Description & Location</span>
            <div className={styles.descriptionText}>{ticket.description}</div>
          </div>

          {/* Hidden File Input for Direct Photo Update */}
          <input
            type="file"
            ref={photoInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleDirectPhotoUpload}
          />

          {/* Photo Management Section */}
          <div className={styles.photoBox}>
            <div className={styles.photoHeader}>
              <span className={styles.sectionLabel}>Attached Photograph</span>
              {isOpen && (isOwner || !isMaintenanceStaff) && ticket.photo_url && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    loading={isUploadingPhoto}
                    icon={<UploadIcon size={14} />}
                  >
                    Replace Photo
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeletePhotoConfirmOpen(true)}
                    loading={isDeletingPhoto}
                    icon={<TrashIcon size={14} />}
                  >
                    Delete Photo
                  </Button>
                </div>
              )}
            </div>

            {ticket.photo_url ? (
              <div className={styles.photoFrame}>
                <img
                  src={ticket.photo_url}
                  alt={ticket.title}
                  className={styles.photoImg}
                  onClick={() => setIsLightboxOpen(true)}
                  title="Click to zoom in full resolution lightbox"
                />
                <div className={styles.photoOverlayBar}>
                  <span>Click image to view in full resolution</span>
                  <div className={styles.photoOverlayActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: '#FFFFFF' }}
                      onClick={() => setIsLightboxOpen(true)}
                      icon={<EyeIcon size={14} />}
                    >
                      Lightbox
                    </Button>
                  </div>
                </div>
              </div>
            ) : isOpen && (isOwner || !isMaintenanceStaff) ? (
              /* Add Photo Callout when none exists */
              <div
                className={styles.emptyPhotoDropzone}
                onClick={() => photoInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-electric-blue)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <ImageIcon size={22} />
                </div>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                  {isUploadingPhoto ? 'Uploading Photo...' : 'Add an Issue Photograph'}
                </strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Upload clear photos of the defect to assist campus repair teams.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ marginTop: '0.5rem' }}
                  loading={isUploadingPhoto}
                  icon={<UploadIcon size={14} />}
                >
                  Select Image
                </Button>
              </div>
            ) : (
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ImageIcon size={18} />
                <span>No photograph was attached with this ticket.</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Sidebar: Status, Deadlines & Notes */}
        <aside className={styles.sidebarCard}>
          <div className={styles.panelItem}>
            <span className={styles.panelLabel}>Current Status</span>
            <div>
              <Badge status={ticket.status}>{ticket.status}</Badge>
            </div>
          </div>

          <div className={styles.panelItem}>
            <span className={styles.panelLabel}>Target SLA Turnaround</span>
            <div className={styles.panelValue}>
              {ticket.expected_by ? formatDateOnlyIST(ticket.expected_by) : 'Not assigned yet'}
            </div>
            {ticket.overdue && (
              <span style={{ color: 'var(--status-overdue-text)', fontSize: '0.75rem', fontWeight: 700 }}>
                ⚠️ Official Overdue Status
              </span>
            )}
          </div>

          {ticket.maintenance_note && (
            <div className={styles.noteAlert}>
              <span className={styles.noteAlertTitle}>Latest Maintenance Note</span>
              <p className={styles.noteAlertText}>{ticket.maintenance_note}</p>
            </div>
          )}

          {ticket.reporter_email && (
            <div className={styles.panelItem}>
              <span className={styles.panelLabel}>Reporter Contact</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <UserIcon size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span>{ticket.reporter_email}</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && ticket.photo_url && (
        <div
          className={styles.lightboxBackdrop}
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-label="Enlarged issue photograph"
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close enlarged view"
          >
            <XIcon size={24} />
          </button>
          <img
            src={ticket.photo_url}
            alt={ticket.title}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modals */}
      <EditTicketModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ticket={ticket}
        onSuccess={(updated) => {
          setTicket(updated);
          toast.success('Ticket Updated', 'Maintenance ticket changes have been saved.');
        }}
      />

      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        ticket={ticket}
        targetStatus={statusTarget}
        onSuccess={(updated) => {
          setTicket(updated);
          toast.success(
            updated.status === 'resolved' ? 'Ticket Resolved' : 'Status Updated',
            'Maintenance update has been posted.'
          );
        }}
      />

      <UpdateTATModal
        isOpen={isTATModalOpen}
        onClose={() => setIsTATModalOpen(false)}
        ticket={ticket}
        onSuccess={(updated) => {
          setTicket(updated);
          toast.success('TAT Updated', 'Turnaround deadline has been recorded.');
        }}
      />

      {/* Confirm Ticket Withdrawal */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTicket}
        title="Withdraw Ticket"
        message="Are you sure you want to delete or withdraw this maintenance ticket? This action cannot be undone."
        confirmText="Withdraw Ticket"
        variant="danger"
        loading={isDeleting}
      />

      {/* Confirm Photo Deletion */}
      <ConfirmDialog
        isOpen={isDeletePhotoConfirmOpen}
        onClose={() => setIsDeletePhotoConfirmOpen(false)}
        onConfirm={handleDeletePhoto}
        title="Delete Issue Photograph"
        message="Are you sure you want to remove the photograph from this maintenance ticket? You can always upload a new one while the ticket remains open."
        confirmText="Remove Photo"
        variant="danger"
        loading={isDeletingPhoto}
      />
    </div>
  );
};
