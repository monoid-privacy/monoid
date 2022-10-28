import React from 'react';
import { classNames } from '../utils/utils';

interface CheckboxProps extends React.HTMLProps<HTMLInputElement> {
  checkboxLabel?: React.ReactNode
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

function Checkbox(props: CheckboxProps) {
  const {
    checkboxLabel, className, id, ...cbProps
  } = props;

  return (
    <div className="relative flex items-start mt-3">
      <div className="flex h-5 items-center">
        <input
          type="checkbox"
          id={id}
          className={
            classNames(
              'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500',
              className,
            )
          }
          {...cbProps}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="font-medium text-gray-700">
          {checkboxLabel}
        </label>
      </div>
    </div>
  );
}

Checkbox.defaultProps = {
  checkboxLabel: undefined,
};

export default Checkbox;
