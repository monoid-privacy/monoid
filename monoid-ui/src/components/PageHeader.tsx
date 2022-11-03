import React, { HTMLProps } from 'react';
import { classNames } from '../utils/utils';
import { H1 } from './Headers';

interface PageHeaderProps extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  actionItem?: React.ReactNode
}

export default function PageHeader(props: PageHeaderProps) {
  const {
    className, title, actionItem, ...divProps
  } = props;
  return (
    <div className={classNames('md:flex md:items-center md:justify-between mb-3', className)} {...divProps}>
      <div className="flex-1 min-w-0">
        <H1 className="leading-7 sm:truncate mr-auto">
          {title}
        </H1>
      </div>

      <div className="mt-4 flex md:mt-0 md:ml-4">
        {actionItem}
      </div>
    </div>
  );
}

PageHeader.defaultProps = {
  actionItem: undefined,
};
