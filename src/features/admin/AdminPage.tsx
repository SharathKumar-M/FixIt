import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './AdminPage.module.css';
import { getTickets, deleteTicket } from '@/api/fixit.api';
import type { Ticket } from '@/api/types';
import { Button, Badge, ConfirmDialog, EmptyState, Skeleton, Pagination } from '@/components/ui';
import { ShieldIcon, TrashIcon, AlertTriangleIcon } from '@/components/icons';
import { formatDateToIST } from '@/utils/date';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
            Read-only platform inspection and emergency ticket deletion.
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
                <th className={styles.th}>Issue Title</th>
                <th className={styles.th}>Reporter</th>
                <th className={styles.th}>Reported At</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.idCol}`}>
                    #{ticket.id.slice(-6).toUpperCase()}
                  </td>
                  <td className={`${styles.td} ${styles.titleCol}`}>{ticket.title}</td>
                  <td className={styles.td}>
                    {ticket.reporter_name || ticket.reporter_email || 'Reporter'}
                  </td>
                  <td className={styles.td}>{formatDateToIST(ticket.created_at)}</td>
                  <td className={styles.td}>
                    <Badge status={ticket.status}>{ticket.status}</Badge>
                  </td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
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
              ))}
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
