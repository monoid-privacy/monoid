import React from 'react';
import { classNames } from '../utils/utils';

interface CardProps extends React.HTMLProps<HTMLDivElement> {
  innerClassName?: string,
}

export default function Card(props: CardProps) {
  const {
    className, innerClassName, children, ...rest
  } = props;

  return (
    <div className={classNames('bg-white shadow sm:rounded-lg', className)} {...rest}>
      <div className={classNames('px-4 py-5 sm:p-6', innerClassName)}>
        {children}
      </div>
    </div>
  );
}

Card.defaultProps = {
  innerClassName: '',
};

interface CardDividerProps extends React.HTMLProps<HTMLDivElement> { }

export function CardDivider(props: CardDividerProps) {
  const { className, ...rest } = props;

  return (
    <div className={classNames('relative py-5 sm:py-6', className)} {...rest}>
      <div className="absolute inset-x-0 inset-top-1/2 flex items-center h-px" aria-hidden="true">
        <div className="w-full border-t border-gray-300" />
      </div>
    </div>
  );
}

interface CardHeaderProps extends React.HTMLProps<HTMLDivElement> { }

export function CardHeader(props: CardHeaderProps) {
  const { children, className, ...rest } = props;

  return (
    <h3 className={classNames('text-lg leading-6 font-medium text-gray-900', className)} {...rest}>{children}</h3>
  );
}
