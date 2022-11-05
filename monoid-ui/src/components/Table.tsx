import React from 'react';
import { classNames } from '../utils/utils';

interface TableColumn {
  header: React.ReactNode
  key: string
}

interface TableRow {
  key: string,
  columns: {
    content: React.ReactNode
    key: string
  }[]
}

interface TableProps extends React.HTMLProps<HTMLDivElement> {
  innerClassName?: string,
  footer?: React.ReactNode
  tableCols?: TableColumn[]
  tableRows?: TableRow[]
}

interface THProps extends React.HTMLProps<HTMLTableCellElement> { }
export function TH(props: THProps) {
  const { children, className, ...rest } = props;
  return (
    <th
      scope="col"
      className={
        classNames(
          'px-3 py-3.5 text-left text-sm font-semibold text-gray-900',
          className,
        )
      }
      {...rest}
    >
      {children}
    </th>
  );
}

interface TDProps extends React.HTMLProps<HTMLTableCellElement> { }

export function TD(props: TDProps) {
  const { children, className, ...tdProps } = props;
  return (
    <td
      className={
        classNames(
          'whitespace-nowrap px-3 py-4 text-sm text-gray-500',
          className,
        )
      }
      {...tdProps}
    >
      {children}
    </td>
  );
}

export default function Table(props: TableProps) {
  const {
    children, tableCols, tableRows, innerClassName, className, footer, ...divProps
  } = props;

  let content = null;

  if (tableCols && tableRows) {
    content = (
      <>
        <thead className="bg-gray-50">
          <tr>
            {
              tableCols.map((c) => (
                <TH key={c.key}>
                  {c.header}
                </TH>
              ))
            }
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {
            tableRows.map((r) => (
              <tr key={r.key}>
                {
                  r.columns.map((c) => (
                    <TD key={c.key}>
                      {c.content}
                    </TD>
                  ))
                }
              </tr>
            ))
          }
        </tbody>
      </>
    );
  } else {
    content = children;
  }

  return (
    <div className={classNames('-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8', className)} {...divProps}>
      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className={classNames('min-w-full divide-y divide-gray-300', innerClassName)}>
            {content}
          </table>
          {footer}
        </div>
      </div>
    </div>
  );
}

Table.defaultProps = {
  innerClassName: undefined,
  footer: undefined,
  tableCols: undefined,
  tableRows: undefined,
};
