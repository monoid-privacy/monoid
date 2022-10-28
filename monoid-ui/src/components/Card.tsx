import React from 'react';
import { classNames } from '../utils/utils';

interface CardProps extends React.HTMLProps<HTMLDivElement> {
  innerClassName?: string
}

export default function Card(props: CardProps) {
  const { className, innerClassName, children } = props;

  return (
    <div {...props} className={classNames('bg-white shadow sm:rounded-lg', className)}>
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
  const { className } = props;

  return (
    <div {...props} className={classNames('relative py-5', className)}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-300" />
      </div>
    </div>
  );
}

interface CardHeaderProps extends React.HTMLProps<HTMLDivElement> { }

export function CardHeader(props: CardHeaderProps) {
  const { children } = props;

  return (
    <h3 className="text-lg leading-6 font-medium text-gray-900">{children}</h3>
  );
}
