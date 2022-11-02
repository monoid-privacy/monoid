import React from 'react';
import { classNames } from '../utils/utils';

export default function Spinner(props: { size?: 'md' | 'lg' }) {
  const { size } = props;
  let sizeClasses = 'h-5 w-5';

  switch (size) {
    case 'lg':
      sizeClasses = 'h-10 w-10';
      break;
    case 'md':
    default:
      sizeClasses = 'h-5 w-5';
      break;
  }
  return (
    <svg className={classNames('animate-spin m-1 text-indigo-600', sizeClasses)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

Spinner.defaultProps = {
  size: 'md',
};
