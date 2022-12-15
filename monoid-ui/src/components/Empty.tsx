import React from 'react';
import { classNames } from '../utils/utils';
import { H2 } from './Headers';

type EmptyStateProps = {
  icon: (props: any) => React.ReactElement,
  title: string
  subtitle: string
  action: React.ReactNode,
  className?: string
};
export default function EmptyState(props: EmptyStateProps) {
  const {
    icon, title, subtitle, action, className,
  } = props;

  const Icon = icon;

  return (
    <div className={classNames('text-center', className)}>
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <H2>{title}</H2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

EmptyState.defaultProps = {
  className: '',
};
