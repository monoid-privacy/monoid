import React, { HTMLProps } from 'react';
import { classNames } from '../utils/utils';
import { H1, H2 } from './Headers';
import Text from './Text';

interface PageHeaderProps extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actionItem?: React.ReactNode
  level?: 'top' | 'second'
}

export default function PageHeader(props: PageHeaderProps) {
  const {
    className, title, subtitle, actionItem, level, ...divProps
  } = props;

  let header: React.ReactNode;

  switch (level) {
    case 'second':
      header = (
        <H2 className="leading-7 sm:truncate mr-auto">
          {title}
        </H2>
      );
      break;
    case 'top':
    default:
      header = (
        <H1 className="leading-10 sm:truncate mr-auto">
          {title}
        </H1>
      );
  }

  return (
    <div className={classNames('md:flex md:items-center md:justify-between mb-3', className)} {...divProps}>
      <div className="flex-1 min-w-0">
        {header}
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
  level: 'top',
};
