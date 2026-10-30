import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './DashboardPage.module.css';
import { useAuth } from '@/hooks/useAuth';
import { getTickets } from '@/api/fixit.api';
import type { Ticket } from '@/api/types';
import {
  Button,
  StatCard,
  TicketCard,
  EmptyState,
  TicketCardSkeleton,
} from '@/components/ui';
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InboxIcon,
  ArrowRightIcon,
} from '@/components/icons';
import { formatRoleName } from '@/utils/format';

export const DashboardPage: React.FC = () => {
  const { user, role, dept } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchDashboardData() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const response = await getTickets({ limit: 50 }, controller.signal);
        if (isMounted) {
          setTickets(response.items);
        }
      } catch (err: any) {
        if (isMounted && err?.code !== 'ABORTED') {
          setErrorMsg(err?.message || 'Failed to fetch your maintenance tickets.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Compute accurate metrics strictly from API-returned tickets
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const acknowledgedCount = tickets.filter((t) => t.status === 'acknowledged').length;
  const overdueCount = tickets.filter((t) => t.overdue && t.status === 'open').length;

  // Tickets awaiting user acknowledgement
  const awaitingAck = tickets.filter((t) => t.status === 'resolved');
  // Recent open tickets
  const recentOpenTickets = tickets.filter((t) => t.status === 'open').slice(0, 6);

  return (
    <div className={styles.container}>
      {/* Welcome Banner */}
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeText}>
          <h1 className={styles.greeting}>Welcome back, {user?.name || 'Campus Member'}</h1>
          <p className={styles.subtitle}>
            {formatRoleName(role || undefined, dept || undefined)} • Track and manage your campus infrastructure requests
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/tickets/new')}
          icon={<PlusIcon size={18} />}
        >
          Report an Issue
        </Button>
      </section>

      {/* Actual Derived Statistics */}
      <section className={styles.statsGrid}>
        <StatCard
          label="Total Tickets"
          value={isLoading ? '—' : totalCount}
          icon={<InboxIcon size={22} />}
          variant="navy"
          subtitle="All submitted issues"
        />
        <StatCard
          label="Open Issues"
          value={isLoading ? '—' : openCount}
          icon={<ClockIcon size={22} />}
          variant="blue"
          subtitle="In maintenance queue"
        />
        <StatCard
          label="Resolved"
          value={isLoading ? '—' : resolvedCount}
          icon={<CheckCircleIcon size={22} />}
          variant="teal"
          subtitle="Ready for confirmation"
        />
        <StatCard
          label="Acknowledged"
          value={isLoading ? '—' : acknowledgedCount}
          icon={<CheckCircleIcon size={22} />}
          variant="emerald"
          subtitle="Successfully closed"
        />
        {overdueCount > 0 && (
          <StatCard
            label="Overdue Target"
            value={isLoading ? '—' : overdueCount}
            icon={<AlertTriangleIcon size={22} />}
            variant="red"
            subtitle="Requires staff escalation"
          />
        )}
      </section>

      {/* Awaiting Acknowledgement Callout */}
      {awaitingAck.length > 0 && (
        <section className={styles.attentionBanner}>
          <div className={styles.attentionContent}>
            <CheckCircleIcon size={24} />
            <div>
              <strong>
                {awaitingAck.length} {awaitingAck.length === 1 ? 'issue has' : 'issues have'} been resolved
              </strong>
              <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
                Please inspect the repair notes and acknowledge resolution to finalize closure.
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/resolutions')}
            icon={<ArrowRightIcon size={14} />}
          >
            Go to Resolution Center
          </Button>
        </section>
      )}

      {/* Recent Open Tickets Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Active Issues in Progress</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
            View All Tickets
          </Button>
        </div>

        {isLoading ? (
          <div className={styles.ticketGrid}>
            <TicketCardSkeleton />
            <TicketCardSkeleton />
            <TicketCardSkeleton />
          </div>
        ) : errorMsg ? (
          <EmptyState
            icon={<AlertTriangleIcon size={28} />}
            title="Failed to Load Tickets"
            description={errorMsg}
            action={
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            }
          />
        ) : recentOpenTickets.length === 0 ? (
          <EmptyState
            title="No Active Issues Reported"
            description="You currently have no open maintenance tickets. Notice any broken fixtures, lighting faults, or facility repairs needed on campus?"
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/tickets/new')}
                icon={<PlusIcon size={16} />}
              >
                Submit New Maintenance Ticket
              </Button>
            }
          />
        ) : (
          <div className={styles.ticketGrid}>
            {recentOpenTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={(t) => navigate(`/tickets/${t.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
