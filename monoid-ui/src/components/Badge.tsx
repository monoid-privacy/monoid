import React from 'react';
import { classNames } from '../utils/utils';

interface BadgeProps extends React.HTMLProps<HTMLSpanElement> {
  color?: 'blue' | 'green' | 'yellow' | 'red'
  actions?: {
    onClick: () => void
    content: React.ReactNode,
  }[]
}

export default function Badge(props: BadgeProps) {
  const {
    className, children, color, actions, ...rest
  } = props;
  let colorClasses = '';
  let actionClasses = '';
  switch (color) {
    case 'green':
      colorClasses = 'bg-green-100 text-green-800';
      actionClasses = 'hover:bg-green-500';
      break;
    case 'yellow':
      colorClasses = 'bg-yellow-100 text-yellow-800';
      actionClasses = 'hover:bg-yellow-500';
      break;
    case 'red':
      colorClasses = 'bg-red-100 text-red-800';
      actionClasses = 'hover:bg-red-500';
      break;
    case 'blue':
    default:
      colorClasses = 'bg-blue-100 text-blue-800';
      actionClasses = 'hover:bg-blue-500';
  }
  return (
    <span
      className={
        classNames(
          'inline-flex items-center rounded-md text-sm font-medium overflow-hidden',
          colorClasses,
          className,
        )
      }
      {...rest}
    >
      <div className={classNames(
        'inline-flex items-center py-0.5',
        actions?.length === 0 || !actions ? 'px-2.5' : 'pl-2.5 pr-1',
      )}
      >
        {children}
      </div>
      {actions?.map((a) => (
        <button
          type="button"
          className={classNames('cursor-pointer h-auto self-stretch px-1', actionClasses)}
          onClick={a.onClick}
        >
          {a.content}
        </button>
      ))}
    </span>
  );
}

Badge.defaultProps = {
  color: 'blue',
  actions: [],
};
