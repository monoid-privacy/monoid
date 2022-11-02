import React from 'react';
import { classNames } from '../utils/utils';

interface HeaderProps extends React.HTMLProps<HTMLHeadingElement> { }

export function H1(props: HeaderProps) {
  const { children, className, ...rest } = props;
  return (
    <h1
      className={classNames(
        'text-3xl font-bold leading-tight tracking-tight text-gray-900',
        className,
      )}
      {...rest}
    >
      {children}
    </h1>
  );
}

export function H2(props: HeaderProps) {
  const { children, className, ...rest } = props;
  return (
    <h2
      className={classNames(
        'text-lg font-medium leading-6 text-gray-900',
        className,
      )}
      {...rest}
    >
      {children}
    </h2>
  );
}

export default {
  H1,
};
