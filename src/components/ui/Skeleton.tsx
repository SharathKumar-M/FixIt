import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius,
  className = '',
}) => {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
      aria-hidden="true"
    />
  );
};

export const TicketCardSkeleton: React.FC = () => (
  <div
    style={{
      padding: '1.25rem',
      backgroundColor: '#FFFFFF',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Skeleton width={90} height={20} />
      <Skeleton width={70} height={20} borderRadius={12} />
    </div>
    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
      <Skeleton width={64} height={64} borderRadius={8} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton width="70%" height={20} />
        <Skeleton width="90%" height={14} />
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem' }}>
      <Skeleton width={130} height={14} />
      <Skeleton width={100} height={14} />
    </div>
  </div>
);
