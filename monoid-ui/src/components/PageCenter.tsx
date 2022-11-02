import React from 'react';
import { classNames } from '../utils/utils';

export default function PageCenter(props: { children: React.ReactNode, className?: string }) {
  const { children, className } = props;
  return (
    <div className="h-full flex flex-col justify-center">
      <div className={classNames('sm:mx-auto items-center content-center', className)}>
        {children}
      </div>
    </div>
  );
}

PageCenter.defaultProps = {
  className: '',
};
