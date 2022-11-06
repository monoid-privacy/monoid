import React, { HTMLProps } from 'react';
import { classNames } from '../utils/utils';
import { H1 } from './Headers';
import Text from './Text';

interface PageHeaderProps extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actionItem?: React.ReactNode
}

export default function PageHeader(props: PageHeaderProps) {
  const {
    className, title, subtitle, actionItem, ...divProps
  } = props;
  return (
    <div className={classNames('md:flex md:items-center md:justify-between mb-3', className)} {...divProps}>
      <div className="flex-1 min-w-0">
        <H1 className="leading-7 sm:truncate mr-auto">
          {title}
        </H1>
        {subtitle
          && (
            <Text size="md" em="light" className="mt-2">
              {subtitle}
            </Text>
          )}
      </div>

      <div className="mt-4 flex md:mt-0 md:ml-4">
        {actionItem}
      </div>
    </div>
  );
}

PageHeader.defaultProps = {
  actionItem: undefined,
  subtitle: undefined,
};
