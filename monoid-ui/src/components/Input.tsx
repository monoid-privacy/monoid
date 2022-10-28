import React from 'react';
import { classNames } from '../utils/utils';

interface InputProps extends React.HTMLProps<HTMLInputElement> {
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

const Input = React.forwardRef((props: InputProps, ref: React.Ref<HTMLInputElement>) => {
  const { className } = props;
  return (
    <input
      {...props}
      ref={ref}
      className={
        classNames(
          'appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          className,
        )
      }
    />
  );
});

interface InputLabelProps extends React.HTMLProps<HTMLLabelElement> { }
export function InputLabel(props: InputLabelProps) {
  const { children, className } = props;
  return (
    <label htmlFor="email" className={classNames('block text-sm font-medium text-gray-700', className)}>
      {children}
    </label>
  );
}

Input.defaultProps = {
  onChange: undefined,
};

export default Input;
