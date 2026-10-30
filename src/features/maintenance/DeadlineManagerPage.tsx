import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './DeadlineManagerPage.module.css';
import { getTickets } from '@/api/fixit.api';
import type { Ticket } from '@/api/types';
import { Button, StatCard, Badge, EmptyState, TicketCardSkeleton } from '@/components/ui';
import { CalendarIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon } from '@/components/icons';
import { formatDateToIST, formatDateOnlyIST } from '@/utils/date';
import { UpdateTATModal } from './UpdateTATModal';

export const DeadlineManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected ticket for TAT update
  const [editingTAT, setEditingTAT] = useState<Ticket | null>(null);

  const fetchTickets = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await getTickets({ status: 'open', limit: 50 }, signal);
      setTickets(response.items);
    } catch (err: any) {
      if (err?.code !== 'ABORTED') {
        setErrorMsg(err?.message || 'Failed to load maintenance deadlines.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTickets(controller.signal);
    return () => controller.abort();
  }, []);

  const overdueTickets = tickets.filter((t) => t.overdue);
  const scheduledTickets = tickets.filter((t) => Boolean(t.expected_by) && !t.overdue);
  const unassignedTickets = tickets.filter((t) => !t.expected_by);

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>SLA & Turnaround Management</h1>
        <p className={styles.subtitle}>
          Enforce campus maintenance SLAs, assign target completion dates, and remediate overdue repair requests.
        </p>
      </div>

      {/* Metrics */}
      <section className={styles.statsGrid}>
        <StatCard
          label="Overdue SLA Targets"
          value={isLoading ? '—' : overdueTickets.length}
          icon={<AlertTriangleIcon size={22} />}
          variant="red"
          subtitle="Action required immediately"
        />
        <StatCard
          label="Active Scheduled"
          value={isLoading ? '—' : scheduledTickets.length}
          icon={<CalendarIcon size={22} />}
          variant="blue"
          subtitle="Within target SLA window"
        />
        <StatCard
          label="Unassigned Turnaround"
          value={isLoading ? '—' : unassignedTickets.length}
          icon={<ClockIcon size={22} />}
          variant="amber"
          subtitle="Needs expected date set"
        />
      </section>

      {/* Deadline Cards */}
      {isLoading ? (
        <div className={styles.cardGrid}>
          <TicketCardSkeleton />
          <TicketCardSkeleton />
          <TicketCardSkeleton />
        </div>
      ) : errorMsg ? (
        <EmptyState
          icon={<AlertTriangleIcon size={28} />}
          title="Could Not Load Deadlines"
          description={errorMsg}
          action={
            <Button variant="outline" size="sm" onClick={() => fetchTickets()}>
              Retry
            </Button>
          }
        />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<CheckCircleIcon size={32} />}
          title="No Active Open Tickets"
          description="There are currently no open maintenance issues requiring deadline supervision."
        />
      ) : (
        <div className={styles.cardGrid}>
          {tickets.map((ticket) => {
            const isOverdue = Boolean(ticket.overdue);

            return (
              <div
                key={ticket.id}
                className={`${styles.deadlineCard} ${isOverdue ? styles.overdueBorder : ''}`}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.ticketId}>#{ticket.id.slice(-6).toUpperCase()}</span>
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    {isOverdue && <Badge variant="overdue">Overdue</Badge>}
                    <Badge status={ticket.status}>{ticket.status}</Badge>
                  </div>
                </div>

                <h3 className={styles.cardTitle}>{ticket.title}</h3>

                <div className={styles.deadlineContainer}>
                  <div>
                    <span className={styles.deadlineLabel}>Turnaround Target</span>
                    <div className={`${styles.deadlineDate} ${isOverdue ? styles.overdueText : ''}`}>
                      {ticket.expected_by ? formatDateOnlyIST(ticket.expected_by) : 'Not Scheduled'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTAT(ticket)}
                  >
                    {ticket.expected_by ? 'Reschedule' : 'Set Deadline'}
                  </Button>
                </div>

                {ticket.maintenance_note && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                    "{ticket.maintenance_note}"
                  </p>
                )}

                <div className={styles.cardFooter}>
                  <span>Reported {formatDateToIST(ticket.created_at)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    View Ticket
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAT Modal */}
      {editingTAT && (
        <UpdateTATModal
          isOpen={Boolean(editingTAT)}
          onClose={() => setEditingTAT(null)}
          ticket={editingTAT}
          onSuccess={handleTicketUpdated}
        />
      )}
    </div>
  );
};
