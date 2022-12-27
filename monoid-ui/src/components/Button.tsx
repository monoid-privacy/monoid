import React from 'react';
import { Link } from 'react-router-dom';
import { classNames } from '../utils/utils';

export type ButtonVariant = 'primary' | 'white' | 'outline-white' | 'danger' | 'outline-danger';

interface ButtonProps extends Omit<React.HTMLProps<HTMLButtonElement>, 'size'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  variant?: ButtonVariant,
  type?: 'button' | 'link',
  to?: string
}

export default function Button(props: ButtonProps) {
  let classes = '';
  const {
    size, variant, className, children, type, to, disabled, ...rest
  } = props;

  switch (size) {
    case 'xs':
      classes = 'px-2.5 py-1.5 border text-xs font-medium rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
      break;
    case 'sm':
      classes = 'px-3 py-2 border text-sm leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
      break;
    case 'lg':
      classes = 'px-4 py-2 border text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
      break;
    case 'xl':
      classes = 'px-6 py-3 border text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
      break;
    default:
      classes = 'px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
      break;
  }

  switch (variant) {
    case 'white':
      classes = classNames(classes, 'border-px border-gray-300 bg-white text-gray-500 hover:bg-gray-50 shadow-sm');
      break;
    case 'danger':
      classes = classNames(classes, 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 border-transparent');
      break;
    case 'outline-white': {
      let colorClasses = 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50';

      if (disabled) {
        colorClasses = 'border border-gray-100 bg-white text-gray-200';
      }

      classes = classNames(classes, colorClasses);

      break;
    }
    case 'outline-danger': {
      let colorClasses = 'border border-gray-300 bg-white text-red-700 hover:bg-red-50';

      if (disabled) {
        colorClasses = 'border border-red-700 bg-white text-red-200';
      }

      classes = classNames(classes, colorClasses);

      break;
    }
    default: {
      let colorClasses = 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 border-transparent';

      if (disabled) {
        colorClasses = 'text-gray-200 bg-indigo-400 border-transparent';
      }

      classes = classNames(classes, colorClasses);
    }
  }

  classes = classNames(classes, className, 'text-center');

  if (type === 'link') {
    let toStr = to;

    if (toStr === undefined) {
      toStr = '#';
    }

    return (
      <Link
        className={classes}
        to={toStr}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

Button.defaultProps = {
  size: 'md',
  variant: 'primary',
  type: 'button',
  to: undefined,
};
