import React from 'react';
import { classNames, min, max } from '../utils/utils';
import Button from './Button';

interface PaginationProps extends React.HTMLProps<HTMLDivElement> {
  limit: number
  offset: number
  totalCount: number
  onOffsetChange: (offset: number) => void
}

export default function Pagination(props: PaginationProps) {
  const {
    className, limit, offset, totalCount, onOffsetChange, ...rest
  } = props;

  const hasNext = offset + limit < totalCount;
  const hasPrev = offset > 0;

  return (
    <nav
      className={
        classNames(
          'flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-4',
          className,
        )
      }
      aria-label="Pagination"
      {...rest}
    >
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Showing
          {' '}
          <span className="font-medium">{offset + 1}</span>
          {' '}
          to
          {' '}
          <span className="font-medium">{min(offset + limit, totalCount)}</span>
          {' '}
          of
          {' '}
          <span className="font-medium">{totalCount}</span>
          {' '}
          results
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end space-x-4">
        <Button variant="outline-white" disabled={!hasPrev} onClick={() => onOffsetChange(max(offset - limit, 0))}>
          Previous
        </Button>
        <Button variant="outline-white" disabled={!hasNext} onClick={() => onOffsetChange(offset + limit)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
