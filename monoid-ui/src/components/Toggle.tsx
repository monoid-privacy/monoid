import { Switch } from '@headlessui/react';
import React from 'react';
import { classNames } from '../utils/utils';

export default function Toggle(props: {
  className?: string,
  checked: boolean,
  size?: 'md' | 'lg'
  onChange: (c: boolean) => void
}) {
  const {
    className, checked, onChange, size,
  } = props;

  let switchSize = '';
  let handleSize = '';
  let translate = '';
  if (size === 'md') {
    switchSize = 'h-6 w-11';
    handleSize = 'h-5 w-5';
    translate = 'translate-x-5';
  } else if (size === 'lg') {
    switchSize = 'h-10 w-16';
    handleSize = 'h-9 w-9';
    translate = 'translate-x-6';
  }

  return (
    <Switch
      checked={checked}
      onChange={onChange}
      className={classNames(
        checked ? 'bg-indigo-600' : 'bg-gray-200',
        'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        switchSize,
        className,
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={classNames(
          checked ? translate : 'translate-x-0',
          handleSize,
          'pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        )}
      />
    </Switch>
  );
}

Toggle.defaultProps = {
  className: '',
  size: 'md',
};
