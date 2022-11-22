import React, { HTMLProps } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { classNames } from '../utils/utils';

export function MonoidLink(props: LinkProps) {
  const { className, children } = props;

  return (
    <Link
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={
        classNames(
          'font-medium text-indigo-600 hover:text-indigo-500',
          className,
        )
      }
    >
      {children}
    </Link>
  );
}

export function MonoidA(props: HTMLProps<HTMLAnchorElement>) {
  const { className, children } = props;

  return (
    <a
      {...props}
      className={
        classNames(
          'font-medium text-indigo-600 hover:text-indigo-500',
          className,
        )
      }
    >
      {children}
    </a>
  );
}
