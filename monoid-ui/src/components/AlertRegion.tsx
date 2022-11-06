import { XCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { classNames } from '../utils/utils';

interface AlertRegionProps extends React.HTMLProps<HTMLDivElement> {
  variant?: 'error' | 'warn'
  alertTitle: React.ReactNode
}

export default function AlertRegion(props: AlertRegionProps) {
  const {
    className, children, alertTitle, variant, ...rest
  } = props;

  let classes = {
    bg: 'bg-red-50',
    icon: 'text-red-400',
    header: 'text-red-800',
    text: 'text-red-700',
  };

  switch (variant) {
    case 'error':
      classes = {
        bg: 'bg-red-50',
        icon: 'text-red-400',
        header: 'text-red-800',
        text: 'text-red-700',
      };
      break;
    case 'warn':
      classes = {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-400',
        header: 'text-yellow-800',
        text: 'text-yellow-700',
      };
      break;
    default:
  }

  return (
    <div className={classNames('rounded-md p-4', classes.bg, className)} {...rest}>
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className={classNames('h-5 w-5', classes.icon)} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={classNames('text-sm font-medium', classes.header)}>
            {alertTitle}
          </h3>
          <div className={classNames('mt-2 text-sm', classes.text)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

AlertRegion.defaultProps = {
  variant: 'error',
};
