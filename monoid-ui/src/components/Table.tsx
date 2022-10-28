import React from 'react';
import { classNames } from '../utils/utils';

interface TableProps extends React.HTMLProps<HTMLDivElement> {
  innerClassName?: string,
  footer?: React.ReactNode
}

export default function Table(props: TableProps) {
  const {
    children, innerClassName, className, footer, ...divProps
  } = props;

  return (
    <div className={classNames('-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8', className)} {...divProps}>
      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className={classNames('min-w-full divide-y divide-gray-300', innerClassName)}>
            {children}
          </table>
          {footer}
        </div>
      </div>
    </div>
  );
}

interface TableCellProps extends React.HTMLProps<HTMLTableCellElement> { }

export function TableCell(props: TableCellProps) {
  const { children, className, ...tdProps } = props;
  return (
    <td
      className={
        classNames(
          'whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6',
          className,
        )
      }
      {...tdProps}
    >
      {children}
    </td>
  );
}

Table.defaultProps = {
  innerClassName: undefined,
  footer: undefined,
};
