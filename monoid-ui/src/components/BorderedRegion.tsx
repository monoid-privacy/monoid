import React from 'react';
import { classNames } from '../utils/utils';

export default function BorderedRegion(props: {
  children: React.ReactNode,
  label: string,
  className?: string
}) {
  const { children, label, className } = props;
  return (
    <div className="relative rounded-md border border-gray-300 px-3 py-2 shadow-sm">
      <div
        className="absolute -top-2.5 left-2 -mt-px inline-block bg-white px-1 text-sm font-medium text-gray-700"
      >
        {label}
      </div>
      <div className={classNames('px-4 py-5 sm:p-6', className)}>
        {children}
      </div>
    </div>
  );
}

BorderedRegion.defaultProps = {
  className: '',
};
