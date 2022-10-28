import React from 'react';
import { classNames } from '../../utils/utils';
import { NavLink } from './types';

export default function Sidebar(props: {
  sections: {
    name?: React.ReactNode,
    links: NavLink[]
  }[]
}) {
  const { sections } = props;

  return (
    <>
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:relative z-10">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col overflow-y-auto">
            {sections.map((s) => (
              <nav className="px-2 py-4 space-y-1">
                {
                  s.name
                  && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {s.name}
                    </h3>
                  )
                }
                {s.links.map((item, inx) => (
                  <button
                    // eslint-disable-next-line react/no-array-index-key
                    key={inx}
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
        </div>
      </div>
    </>

  );
}
