import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './MaintenanceDashboardPage.module.css';
import { getTickets } from '@/api/fixit.api';
import type { Ticket } from '@/api/types';
import { Button, StatCard, Badge, EmptyState, Skeleton } from '@/components/ui';
import {
  ShieldIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  InboxIcon,
  TagIcon,
} from '@/components/icons';
import { formatDateToIST, formatDateOnlyIST } from '@/utils/date';

export const MaintenanceDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadData() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const response = await getTickets({ limit: 50 }, controller.signal);
        if (isMounted) {
          setTickets(response.items);
        }
      } catch (err: any) {
        if (isMounted && err?.code !== 'ABORTED') {
          setErrorMsg(err?.message || 'Failed to fetch tickets for maintenance control center.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Compute accurate metrics
  const total = tickets.length;
  const open = tickets.filter((t) => t.status === 'open').length;
  const resolved = tickets.filter((t) => t.status === 'resolved').length;
  const acknowledged = tickets.filter((t) => t.status === 'acknowledged').length;
  const overdue = tickets.filter((t) => t.overdue && t.status === 'open').length;

  // Priority Work Queue: Overdue open tickets first, then newest open tickets
  const priorityQueue = [...tickets]
    .filter((t) => t.status === 'open')
    .sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 8);

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <section className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.tagline}>Campus Operations Control</span>
          <h1 className={styles.title}>Maintenance Control Center</h1>
          <p className={styles.subtitle}>
            Direct oversight of campus repairs, triage dispatch, SLA turnaround tracking, and defect resolution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={() => navigate('/maintenance/issue-types')}
            icon={<TagIcon size={16} />}
          >
            Manage Categories
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/maintenance/tickets')}
            icon={<ArrowRightIcon size={16} />}
          >
            Open Ticket Workbench
          </Button>
        </div>
      </section>

      {/* Operational Metrics */}
      <section className={styles.statsGrid}>
        <StatCard
          label="Total Registered"
          value={isLoading ? '—' : total}
          icon={<InboxIcon size={22} />}
          variant="navy"
          subtitle="All campus logs"
        />
        <StatCard
          label="Active Work Queue"
          value={isLoading ? '—' : open}
          icon={<ClockIcon size={22} />}
          variant="blue"
          subtitle="Tickets in progress"
          onClick={() => navigate('/maintenance/tickets?status=open')}
        />
        <StatCard
          label="Overdue SLA"
          value={isLoading ? '—' : overdue}
          icon={<AlertTriangleIcon size={22} />}
          variant="red"
          subtitle="Target date breached"
          onClick={() => navigate('/maintenance/deadlines')}
        />
        <StatCard
          label="Completed Repairs"
          value={isLoading ? '—' : resolved}
          icon={<CheckCircleIcon size={22} />}
          variant="teal"
          subtitle="Awaiting sign-off"
          onClick={() => navigate('/maintenance/tickets?status=resolved')}
        />
        <StatCard
          label="Closed & Confirmed"
          value={isLoading ? '—' : acknowledged}
          icon={<CheckCircleIcon size={22} />}
          variant="emerald"
          subtitle="Fully acknowledged"
        />
      </section>

      {/* Priority Work Queue */}
      <section className={styles.queueSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <ShieldIcon size={20} style={{ color: 'var(--color-electric-blue)' }} />
            <span>Priority Work Queue</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/maintenance/tickets')}>
            View Full Workbench
          </Button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton width="100%" height={56} borderRadius={8} />
            <Skeleton width="100%" height={56} borderRadius={8} />
            <Skeleton width="100%" height={56} borderRadius={8} />
          </div>
        ) : errorMsg ? (
          <EmptyState
            icon={<AlertTriangleIcon size={28} />}
            title="Failed to Load Queue"
            description={errorMsg}
            action={
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        ) : priorityQueue.length === 0 ? (
          <EmptyState
            title="No Pending Work in Priority Queue"
            description="All reported maintenance tickets are currently resolved or acknowledged. Great work!"
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Ticket</th>
                  <th className={styles.th}>Issue Title</th>
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>Reported</th>
                  <th className={styles.th}>SLA Target</th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {priorityQueue.map((ticket) => {
                  const categoryName = typeof ticket.issue_type === 'object' && ticket.issue_type !== null
                    ? ticket.issue_type.name
                    : ticket.issue_type || 'General Maintenance';

                  return (
                    <tr
                      key={ticket.id}
                      className={styles.tr}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      title="Click to inspect ticket"
                    >
                      <td className={`${styles.td} ${styles.ticketIdCol}`}>
                        #{ticket.id.slice(-6).toUpperCase()}
                      </td>
                      <td className={`${styles.td} ${styles.titleCol}`}>{ticket.title}</td>
                      <td className={styles.td}>
                        <Badge variant="category" showDot={false}>
                          {categoryName}
                        </Badge>
                      </td>
                      <td className={styles.td}>{formatDateToIST(ticket.created_at)}</td>
                      <td className={styles.td}>
                        {ticket.expected_by ? (
                          <span style={{ color: ticket.overdue ? 'var(--status-overdue-text)' : 'inherit', fontWeight: ticket.overdue ? 700 : 500 }}>
                            {formatDateOnlyIST(ticket.expected_by)} {ticket.overdue && '(Overdue)'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>Not set</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                          {ticket.overdue && <Badge variant="overdue">Overdue</Badge>}
                          <Badge status={ticket.status}>{ticket.status}</Badge>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
