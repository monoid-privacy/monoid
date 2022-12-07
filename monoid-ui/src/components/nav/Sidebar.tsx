/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { classNames } from '../../utils/utils';
import { NavLink } from './types';

export default function Sidebar(props: {
  sections: {
    name?: React.ReactNode,
    key: string,
    links: NavLink[]
  }[],
  footer?: {
    node: React.ReactNode
    onClick?: () => void
  }
}) {
  const { sections, footer } = props;

  return (
    <>
      {/* Static sidebar for desktop */}
      <div className="hidden h-[calc(100vh_-_theme(space.16))] top-16 fixed md:w-64 md:flex md:flex-col z-10">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col overflow-y-auto">
            {sections.map((s) => (
              <nav className="px-2 py-4 space-y-1" key={s.key}>
                {
                  s.name
                  && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {s.name}
                    </h3>
                  )
                }
                {s.links.map((item) => (
                  <button
                    // eslint-disable-next-line react/no-array-index-key
                    key={item.key}
                    className={classNames(
                      item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full',
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      item.onClick();
                    }}
                    type="button"
                  >
                    {item.icon
                      && (
                        <item.icon
                          className={classNames(
                            item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 flex-shrink-0 h-6 w-6',
                          )}
                          aria-hidden="true"
                        />
                      )}
                    {item.title}
                  </button>
                ))}
              </nav>
            ))}
          </div>
          {footer
            && (
              <div
                className={
                  classNames(
                    'flex flex-shrink-0 border-t border-gray-200 p-4',
                    footer.onClick ? 'cursor-pointer hover:bg-gray-200' : '',
                  )
                }
                onClick={footer.onClick}
              >
                {footer.node}
              </div>
            )}
        </div>
      </div>
    </>

  );
}

Sidebar.defaultProps = {
  footer: undefined,
};
