import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './AdminPage.module.css';
import { getTickets, deleteTicket } from '@/api/fixit.api';
import type { Ticket } from '@/api/types';
import { Button, Badge, Modal, ConfirmDialog, EmptyState, Skeleton, Pagination } from '@/components/ui';
import { ShieldIcon, TrashIcon, AlertTriangleIcon, ImageIcon, EyeIcon, XIcon } from '@/components/icons';
import { formatDateToIST, formatDateOnlyIST } from '@/utils/date';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inspection modal state
  const [inspectingTicket, setInspectingTicket] = useState<Ticket | null>(null);

  // Lightbox photo state
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Deletion modal state
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTickets = async (cursor: string | null = null, signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await getTickets({ limit: 50, cursor: cursor || undefined }, signal);
      setTickets(response.items);
      setTotalCount(response.count);
      setNextCursor(response.next_cursor ?? null);
    } catch (err: any) {
      if (err?.code !== 'ABORTED') {
        setErrorMsg(err?.message || 'Failed to fetch tickets in admin inspection view.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTickets(null, controller.signal);
    return () => controller.abort();
  }, []);

  const handleDelete = async () => {
    if (!deletingTicket) return;
    setIsDeleting(true);
    try {
      await deleteTicket(deletingTicket.id);
      setTickets((prev) => prev.filter((t) => t.id !== deletingTicket.id));
      if (inspectingTicket?.id === deletingTicket.id) {
        setInspectingTicket(null);
      }
      setDeletingTicket(null);
    } catch (err: any) {
      alert(err?.message || 'Admin ticket deletion failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6D28D9', marginBottom: '0.25rem' }}>
            <ShieldIcon size={20} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Administrator Mode
            </span>
          </div>
          <h1 className={styles.title}>FixIt Ticket Administration</h1>
          <p className={styles.subtitle}>
            Read-only platform inspection, photo auditing, and emergency ticket deletion.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.tableCard} style={{ padding: '2rem' }}>
          <Skeleton width="100%" height={48} borderRadius={8} />
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton width="100%" height={40} borderRadius={6} />
            <Skeleton width="100%" height={40} borderRadius={6} />
            <Skeleton width="100%" height={40} borderRadius={6} />
          </div>
        </div>
      ) : errorMsg ? (
        <EmptyState
          icon={<AlertTriangleIcon size={28} />}
          title="Could Not Load Admin View"
          description={errorMsg}
          action={
            <Button variant="outline" size="sm" onClick={() => fetchTickets()}>
              Retry
            </Button>
          }
        />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No Tickets Found"
          description="There are currently no maintenance tickets logged in the system."
        />
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Ticket ID</th>
                <th className={styles.th}>Photograph</th>
                <th className={styles.th}>Issue Title</th>
                <th className={styles.th}>Reporter</th>
                <th className={styles.th}>Reported At</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const categoryName = typeof ticket.issue_type === 'object' && ticket.issue_type !== null
                  ? ticket.issue_type.name
                  : ticket.issue_type || 'General Maintenance';

                return (
                  <tr key={ticket.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.idCol}`}>
                      #{ticket.id.slice(-6).toUpperCase()}
                    </td>
                    <td className={styles.td}>
                      {ticket.photo_url ? (
                        <div
                          className={styles.photoThumbContainer}
                          onClick={() => setLightboxPhoto(ticket.photo_url || null)}
                          title="Click to view full photo in lightbox"
                        >
                          <img
                            src={ticket.photo_url}
                            alt={ticket.title}
                            className={styles.photoThumb}
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className={styles.thumbHoverBadge}>
                            <EyeIcon size={14} />
                          </div>
                        </div>
                      ) : (
                        <span className={styles.noPhotoTag}>
                          <ImageIcon size={13} /> None
                        </span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.titleCol}`}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span>{ticket.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {categoryName}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {ticket.reporter_name || ticket.reporter_email || 'Reporter'}
                    </td>
                    <td className={styles.td}>{formatDateToIST(ticket.created_at)}</td>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        {ticket.overdue && <Badge variant="overdue">Overdue</Badge>}
                        <Badge status={ticket.status}>{ticket.status}</Badge>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectingTicket(ticket)}
                          icon={<EyeIcon size={14} />}
                        >
                          Inspect
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingTicket(ticket)}
                          icon={<TrashIcon size={14} />}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: '0 1.25rem 0.5rem' }}>
            <Pagination
              currentCount={tickets.length}
              totalCount={totalCount}
              hasNextPage={Boolean(nextCursor)}
              onNext={() => {
                if (nextCursor) fetchTickets(nextCursor);
              }}
              loading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Admin Ticket Inspection Modal */}
      {inspectingTicket && (
        <Modal
          isOpen={Boolean(inspectingTicket)}
          onClose={() => setInspectingTicket(null)}
          title={`Audit Inspection — Ticket #${inspectingTicket.id.slice(-6).toUpperCase()}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const t = inspectingTicket;
                  setDeletingTicket(t);
                }}
                icon={<TrashIcon size={14} />}
              >
                Delete Ticket
              </Button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/tickets/${inspectingTicket.id}`)}
                >
                  Full Page View
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setInspectingTicket(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className={styles.modalBody}>
            {/* Attached Photo View */}
            {inspectingTicket.photo_url ? (
              <div className={styles.modalPhotoFrame}>
                <img
                  src={inspectingTicket.photo_url}
                  alt={inspectingTicket.title}
                  className={styles.modalPhotoImg}
                  onClick={() => setLightboxPhoto(inspectingTicket.photo_url || null)}
                  title="Click to zoom in lightbox"
                />
                <div className={styles.modalPhotoBar}>
                  <span>Click image to open high-resolution lightbox</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: '#FFFFFF', padding: '0.2rem 0.5rem', height: 'auto' }}
                    onClick={() => setLightboxPhoto(inspectingTicket.photo_url || null)}
                    icon={<EyeIcon size={12} />}
                  >
                    Zoom Lightbox
                  </Button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '1.75rem',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  color: 'var(--color-text-muted)',
                  border: '1px dashed var(--color-border-subtle)',
                }}
              >
                <ImageIcon size={22} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  No photograph attached to this maintenance ticket
                </span>
              </div>
            )}

            {/* Quick Details Grid */}
            <div className={styles.modalDetailGrid}>
              <div className={styles.modalDetailItem}>
                <span className={styles.modalDetailLabel}>Status & Priority</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <Badge status={inspectingTicket.status}>{inspectingTicket.status}</Badge>
                  {inspectingTicket.overdue && <Badge variant="overdue">Overdue</Badge>}
                </div>
              </div>

              <div className={styles.modalDetailItem}>
                <span className={styles.modalDetailLabel}>Category</span>
                <span className={styles.modalDetailVal}>
                  {typeof inspectingTicket.issue_type === 'object' && inspectingTicket.issue_type !== null
                    ? inspectingTicket.issue_type.name
                    : inspectingTicket.issue_type || 'General Maintenance'}
                </span>
              </div>

              <div className={styles.modalDetailItem}>
                <span className={styles.modalDetailLabel}>Reported By</span>
                <span className={styles.modalDetailVal}>
                  {inspectingTicket.reporter_name || 'Campus Member'} ({inspectingTicket.reporter_email || 'student@campus.edu'})
                </span>
              </div>

              <div className={styles.modalDetailItem}>
                <span className={styles.modalDetailLabel}>Reported Timestamp (IST)</span>
                <span className={styles.modalDetailVal}>
                  {formatDateToIST(inspectingTicket.created_at)}
                </span>
              </div>

              {inspectingTicket.expected_by && (
                <div className={styles.modalDetailItem}>
                  <span className={styles.modalDetailLabel}>Target TAT Deadline</span>
                  <span className={styles.modalDetailVal} style={{ color: inspectingTicket.overdue ? 'var(--status-overdue-text)' : 'inherit' }}>
                    {formatDateOnlyIST(inspectingTicket.expected_by)}
                  </span>
                </div>
              )}

              {inspectingTicket.resolved_at && (
                <div className={styles.modalDetailItem}>
                  <span className={styles.modalDetailLabel}>Resolved At</span>
                  <span className={styles.modalDetailVal}>
                    {formatDateToIST(inspectingTicket.resolved_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className={styles.modalDescBox}>
              <span className={styles.modalDetailLabel}>Issue Title & Description</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                {inspectingTicket.title}
              </strong>
              <div className={styles.modalDescText}>
                {inspectingTicket.description}
              </div>
            </div>

            {/* Maintenance Progress Notes */}
            {inspectingTicket.maintenance_note && (
              <div className={styles.modalDescBox}>
                <span className={styles.modalDetailLabel}>Latest Maintenance Update / Technician Notes</span>
                <div
                  className={styles.modalDescText}
                  style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534' }}
                >
                  {inspectingTicket.maintenance_note}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Fullscreen Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className={styles.lightboxBackdrop}
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-label="Enlarged photo preview"
        >
          <button
            type="button"
            className={styles.lightboxCloseBtn}
            onClick={() => setLightboxPhoto(null)}
            aria-label="Close photo preview"
          >
            <XIcon size={22} />
          </button>
          <img
            src={lightboxPhoto}
            alt="Enlarged issue defect preview"
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTicket && (
        <ConfirmDialog
          isOpen={Boolean(deletingTicket)}
          onClose={() => setDeletingTicket(null)}
          onConfirm={handleDelete}
          title="Delete Ticket (Admin)"
          message={`Are you sure you want to administratively delete ticket #${deletingTicket.id.slice(-6).toUpperCase()} ("${deletingTicket.title}")? This action permanently removes the record from the database.`}
          confirmText="Permanently Delete"
          variant="danger"
          loading={isDeleting}
        />
      )}
    </div>
  );
};
