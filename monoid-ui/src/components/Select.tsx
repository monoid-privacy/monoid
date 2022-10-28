import React from 'react';
import { classNames } from '../utils/utils';

interface SelectProps extends React.HTMLProps<HTMLSelectElement> {
  onChange: React.ChangeEventHandler<HTMLSelectElement>
}

export default function Select(props: SelectProps) {
  const { className, children, ...selectProps } = props;

  return (
    <select
      className={classNames(
        'block w-full pl-3 pr-10 py-2 text-base border-gray-300',
        'focus:outline-none focus:ring-indigo-500 focus:border-indigo-500',
        'sm:text-sm rounded-md',
        className,
      )}
      {...selectProps}
    >
      {children}
    </select>
  );
}
