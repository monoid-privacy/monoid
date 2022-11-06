import React, { useEffect } from 'react';
import { classNames } from '../utils/utils';

interface TabsProps extends React.HTMLProps<HTMLDivElement> {
  tabs: {
    tabName: string,
    tabKey: string,
    tabBody: React.ReactNode
  }[],
  bodyClassName?: string,
  variant?: 'pill' | 'line',
  current: string,
  setCurrent: (c: string) => void
}

export default function Tabs(props: TabsProps) {
  const {
    tabs, className, bodyClassName, variant, current, setCurrent,
  } = props;

  useEffect(() => {
    if (!current && tabs.length !== 0) {
      setCurrent(tabs[0].tabKey);
    }
  }, [tabs, current, setCurrent]);

  const curr = tabs.filter(({ tabKey }) => tabKey === current)[0];

  return (
    <div className="flex flex-col">
      <nav
        className={variant === 'pill' ? classNames(
          'relative z-0 rounded-md border border-gray flex divide-x divide-gray-200',
          className,
        ) : classNames(
          'flex space-x-8',
          className,
        )}
        aria-label="Tabs"
      >
        {tabs.map(({ tabName, tabKey }, ix) => (
          variant === 'pill'
            ? (
              <button
                key={tabKey}
                type="button"
                onClick={() => setCurrent(tabKey)}
                className={classNames(
                  current === tabKey ? 'text-white bg-indigo-700 hover:bg-indigo-900' : 'text-gray-500 hover:text-gray-700',
                  ix === 0 ? 'rounded-l-lg' : '',
                  ix === tabs.length - 1 ? 'rounded-r-lg' : '',
                  'group relative min-w-0 flex-1 overflow-hidden bg-white py-3 px-4 text-sm font-medium text-center hover:bg-gray-50 focus:z-10',
                )}
                aria-current={current === tabKey ? 'page' : undefined}
              >
                <span>{tabName}</span>
              </button>
            )
            : (
              <button
                key={tabKey}
                type="button"
                onClick={() => setCurrent(tabKey)}
                className={classNames(
                  current === tabKey
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                )}
                aria-current={current === tabKey ? 'page' : undefined}
              >
                {tabName}
              </button>
            )
        ))}
      </nav>
      {curr && (
        <div className={classNames('', bodyClassName)}>
          {curr.tabBody}
        </div>
      )}
    </div>
  );
}

Tabs.defaultProps = {
  variant: 'pill',
  bodyClassName: '',
};
