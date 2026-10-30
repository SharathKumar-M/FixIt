import React from 'react';
import styles from './StatCard.module.css';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: 'blue' | 'teal' | 'emerald' | 'amber' | 'red' | 'navy';
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  variant = 'blue',
  subtitle,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      <div className={`${styles.iconWrapper} ${styles[variant]}`}>{icon}</div>
    </div>
  );
};
