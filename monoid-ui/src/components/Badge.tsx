import React from 'react';
import { classNames } from '../utils/utils';

interface BadgeProps extends React.HTMLProps<HTMLSpanElement> { }

export default function Badge(props: BadgeProps) {
  const { className, children, ...rest } = props;

  return (
    <span
      className={
        classNames(
          'inline-flex items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800',
          className,
        )
      }
      {...rest}
    >
      {children}
    </span>
  );
}
