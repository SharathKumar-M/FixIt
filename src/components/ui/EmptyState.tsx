import React from 'react';
import styles from './EmptyState.module.css';
import { InboxIcon } from '../icons';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <InboxIcon size={28} />,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.iconWrapper}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};
