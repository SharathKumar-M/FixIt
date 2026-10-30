import React from 'react';
import styles from './Badge.module.css';
import type { TicketStatus } from '@/api/types';

export interface BadgeProps {
  variant?: 'open' | 'resolved' | 'acknowledged' | 'overdue' | 'category' | 'role';
  status?: TicketStatus;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  status,
  children,
  showDot = true,
  className = '',
}) => {
  const resolvedVariant = variant || (status ? (status as BadgeProps['variant']) : 'category');

  return (
    <span className={`${styles.badge} ${styles[resolvedVariant || 'category']} ${className}`}>
      {showDot && (
        <span
          className={resolvedVariant === 'overdue' ? styles.pulseDot : styles.dot}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
