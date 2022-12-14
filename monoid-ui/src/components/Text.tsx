import React from 'react';
import { classNames } from '../utils/utils';

interface TextProps extends Omit<React.HTMLProps<HTMLDivElement>, 'size'> {
  size?: 'xs' | 'sm' | 'md' | 'lg',
  em?: 'light' | 'normal' | 'bold'
  as?: 'p' | 'div'
}

export default function Text(props: TextProps) {
  const {
    children, as, className, size, em, ...rest
  } = props;
  let sizeCls = '';
  switch (size) {
    case 'xs':
      sizeCls = 'text-xs';
      break;
    case 'sm':
      sizeCls = 'text-sm';
      break;
    case 'md':
      sizeCls = 'text-md';
      break;
    case 'lg':
      sizeCls = 'text-lg';
      break;
    default:
      sizeCls = 'text-md';
  }

  let emCls = '';
  switch (em) {
    case 'light':
      emCls = 'text-gray-400';
      break;
    case 'normal':
      emCls = '';
      break;
    case 'bold':
      emCls = 'font-semibold';
      break;
    default:
      break;
  }

  return React.createElement(as!, {
    className: classNames(className, sizeCls, emCls),
    ...rest,
  }, children);
}

Text.defaultProps = {
  size: 'md',
  em: 'normal',
  as: 'div',
};
