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

  let color = 'red';
  switch (variant) {
    case 'error':
      color = 'red';
      break;
    case 'warn':
      color = 'yellow';
      break;
    default:
  }

  return (
    <div className={classNames(`rounded-md bg-${color}-50 p-4`, className)} {...rest}>
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className={`h-5 w-5 text-${color}-400`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium text-${color}-800`}>
            {alertTitle}
          </h3>
          <div className={`mt-2 text-sm text-${color}-700`}>
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
