import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';
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
  onClick?: () => void
  nestedComponent?: React.ReactNode
}

interface TableProps extends React.HTMLProps<HTMLDivElement> {
  innerClassName?: string,
  footer?: React.ReactNode
  tableCols?: TableColumn[]
  tableRows?: TableRow[]
  nested?: boolean
  type?: 'plain' | 'card'
  insetClass?: string,
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

export function TableRowComp(props: {
  row: TableRow,
  showLeftPlaceholder?: boolean,
  insetClass?: string
}) {
  const { row, showLeftPlaceholder, insetClass } = props;
  const [open, setOpen] = useState(false);
  const onClick = useCallback(() => {
    if (row.nestedComponent) {
      setOpen(!open);
    }

    if (row.onClick) {
      row.onClick();
    }
  }, [row.onClick, row.nestedComponent, open]);

  const currRow = (
    <tr
      onClick={onClick}
      className={
        row.nestedComponent || row.onClick ? 'cursor-pointer hover:bg-gray-100' : ''
      }
    >
      {
        showLeftPlaceholder
        && (
          <td className={classNames('text-gray-500 w-8 pl-3', insetClass)}>
            {row.nestedComponent && (
              open ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />
            )}
          </td>
        )
      }
      {
        row.columns.map((c, i) => (
          <TD key={c.key} className={!showLeftPlaceholder && i === 0 ? classNames('pl-4 sm:pl-6', insetClass) : ''}>
            {c.content}
          </TD>
        ))
      }
    </tr>
  );

  if (!open || !row.nestedComponent) {
    return currRow;
  }

  return (
    <>
      {currRow}
      {row.nestedComponent}
    </>
  );
}

TableRowComp.defaultProps = {
  showLeftPlaceholder: false,
  insetClass: '',
};

export default function Table(props: TableProps) {
  const {
    type, insetClass, children, nested,
    tableCols, tableRows, innerClassName,
    className, footer, ...divProps
  } = props;

  let content = null;

  if (tableCols && tableRows) {
    content = (
      <>
        <thead className="bg-gray-50">
          <tr>
            {
              // eslint-disable-next-line jsx-a11y/control-has-associated-label
              nested && <th className={classNames('w-8 pl-3', insetClass)} />
            }
            {
              tableCols.map((c, i) => (
                <TH key={c.key} className={i === 0 && !nested ? classNames('pl-4 sm:pl-6', insetClass) : ''}>
                  {c.header}
                </TH>
              ))
            }
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {
            tableRows.map((r) => (
              <TableRowComp
                key={r.key}
                row={r}
                showLeftPlaceholder={nested}
                insetClass={insetClass}
              />
            ))
          }
        </tbody>
      </>
    );
  } else {
    content = children;
  }

  switch (type) {
    case 'plain':
      return (
        <div className={classNames('overflow-hidden', className)}>
          <table className={classNames('min-w-full divide-y divide-gray-300', innerClassName)}>
            {content}
          </table>
          {footer}
        </div>
      );

    case 'card':
    default:
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
}

Table.defaultProps = {
  innerClassName: undefined,
  footer: undefined,
  tableCols: undefined,
  tableRows: undefined,
  nested: false,
  type: 'card',
  insetClass: '',
};
