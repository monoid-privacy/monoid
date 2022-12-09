import React from 'react';
import { classNames } from 'utils/utils';

interface DividerProps extends React.HTMLProps<HTMLDivElement> { }

export default function Divider(props: DividerProps) {
  const { children, className, ...rest } = props;
  return (
    <div className={classNames('relative', className)} {...rest}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-300" />
      </div>
      {
        children
        && (
          <div className="relative flex justify-center">
            <span className="bg-gray-100 px-2 text-sm text-gray-500">{children}</span>
          </div>
        )
      }
    </div>
  );
}
