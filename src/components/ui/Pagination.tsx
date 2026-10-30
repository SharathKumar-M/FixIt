import React from 'react';
import styles from './Pagination.module.css';
import { Button } from './Button';
import { ChevronRightIcon, ArrowLeftIcon } from '../icons';

export interface PaginationProps {
  currentCount: number;
  totalCount?: number;
  hasNextPage: boolean;
  hasPrevPage?: boolean;
  onNext: () => void;
  onPrev?: () => void;
  loading?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentCount,
  totalCount,
  hasNextPage,
  hasPrevPage = false,
  onNext,
  onPrev,
  loading = false,
  className = '',
}) => {
  if (currentCount === 0 && !hasNextPage && !hasPrevPage) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.summary}>
        Showing <span className={styles.count}>{currentCount}</span>
        {typeof totalCount === 'number' && totalCount > 0 && (
          <> of <span className={styles.count}>{totalCount}</span></>
        )}{' '}
        tickets
      </div>

      <div className={styles.actions}>
        {onPrev && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!hasPrevPage || loading}
            icon={<ArrowLeftIcon size={14} />}
          >
            Previous
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNextPage || loading}
          loading={loading}
          icon={!loading ? <ChevronRightIcon size={14} /> : undefined}
        >
          Next Page
        </Button>
      </div>
    </div>
  );
};
