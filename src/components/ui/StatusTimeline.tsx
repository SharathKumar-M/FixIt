import React from 'react';
import styles from './StatusTimeline.module.css';
import type { TicketStatus } from '@/api/types';
import { CheckIcon, ClockIcon, WrenchIcon } from '../icons';
import { formatDateToIST } from '@/utils/date';

export interface StatusTimelineProps {
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  className?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  status,
  createdAt,
  resolvedAt,
  acknowledgedAt,
  className = '',
}) => {
  // Determine states for 3 stages: OPEN -> RESOLVED -> ACKNOWLEDGED
  const isResolvedOrBeyond = status === 'resolved' || status === 'acknowledged';
  const isAcknowledged = status === 'acknowledged';

  const getStepClass = (stepName: 'open' | 'resolved' | 'acknowledged') => {
    if (stepName === 'open') {
      return isResolvedOrBeyond ? styles.stepCompleted : styles.stepActive;
    }
    if (stepName === 'resolved') {
      if (isAcknowledged) return styles.stepCompleted;
      if (status === 'resolved') return styles.stepActive;
      return styles.stepPending;
    }
    if (stepName === 'acknowledged') {
      if (isAcknowledged) return styles.stepCompleted;
      return styles.stepPending;
    }
    return styles.stepPending;
  };

  return (
    <div className={`${styles.lifecycleContainer} ${className}`} aria-label="Ticket lifecycle progress">
      <div className={styles.lifecycleHeader}>
        <span className={styles.title}>Official Lifecycle Status</span>
      </div>

      <div className={styles.stepper}>
        {/* Step 1: OPEN */}
        <div className={`${styles.step} ${getStepClass('open')}`}>
          <div className={styles.stepIcon}>
            {isResolvedOrBeyond ? <CheckIcon size={20} /> : <ClockIcon size={20} />}
          </div>
          <div>
            <div className={styles.stepTitle}>1. Open</div>
            <div className={styles.stepTime}>{formatDateToIST(createdAt)}</div>
          </div>
        </div>

        {/* Connector 1 */}
        <div
          className={`${styles.connector} ${isResolvedOrBeyond ? styles.connectorCompleted : ''}`}
          aria-hidden="true"
        />

        {/* Step 2: RESOLVED */}
        <div className={`${styles.step} ${getStepClass('resolved')}`}>
          <div className={styles.stepIcon}>
            {isAcknowledged ? <CheckIcon size={20} /> : <WrenchIcon size={20} />}
          </div>
          <div>
            <div className={styles.stepTitle}>2. Resolved</div>
            <div className={styles.stepTime}>
              {resolvedAt ? formatDateToIST(resolvedAt) : isResolvedOrBeyond ? 'Completed by Maintenance' : 'Pending maintenance'}
            </div>
          </div>
        </div>

        {/* Connector 2 */}
        <div
          className={`${styles.connector} ${isAcknowledged ? styles.connectorCompleted : ''}`}
          aria-hidden="true"
        />

        {/* Step 3: ACKNOWLEDGED */}
        <div className={`${styles.step} ${getStepClass('acknowledged')}`}>
          <div className={styles.stepIcon}>
            <CheckIcon size={20} />
          </div>
          <div>
            <div className={styles.stepTitle}>3. Acknowledged</div>
            <div className={styles.stepTime}>
              {acknowledgedAt ? formatDateToIST(acknowledgedAt) : isAcknowledged ? 'Confirmed by Reporter' : 'Awaiting confirmation'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
