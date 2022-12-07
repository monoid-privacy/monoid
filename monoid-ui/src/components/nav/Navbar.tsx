import React from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { classNames } from '../../utils/utils';
import { NavLink } from './types';
import logo from '../../logo.svg';
import wordmark from '../../wordmark.svg';

export default function Navbar(props: {
  links: NavLink[],
  showDropdown?: boolean,
  dropdownLinks: NavLink[],
  hiddenLinks: NavLink[],
}) {
  const {
    links, showDropdown, dropdownLinks, hiddenLinks,
  } = props;

  return (
    <Disclosure as="nav" className="bg-white border-b z-20 fixed top-0 w-full">
      {(o: { open: boolean }) => {
        const { open } = o;
        return (
          <>
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <img
                      className="lg:hidden block h-10 mr-2 w-auto"
                      src={logo}
                      alt="Brist Logo"
                    />
                    <img
                      className="hidden lg:block h-10 w-auto"
                      src={wordmark}
                      alt="Brist Wordmark"
                    />
                  </div>
                  <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                    {links.map((item, ix) => (
                      <button
                        // eslint-disable-next-line react/no-array-index-key
                        key={ix}
                        onClick={item.onClick}
                        className={classNames(
                          item.current
                            ? 'border-indigo-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                          'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                        )}
                        aria-current={item.current ? 'page' : undefined}
                        type="button"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  {/* Profile dropdown */}
                  {showDropdown
                    && (
                      <Menu as="div" className="ml-3 relative">
                        <div>
                          <Menu.Button className="bg-white flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <span className="sr-only">Open user menu</span>
                            <UserCircleIcon className="h-8 w-8 rounded-full text-gray-400" />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={React.Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {dropdownLinks.map((item, ix) => (
                              // eslint-disable-next-line react/no-array-index-key
                              <Menu.Item key={ix}>
                                {(a: { active: boolean }) => {
                                  const { active } = a;
                                  return (
                                    <button
                                      className={classNames(
                                        active ? 'bg-gray-100' : '',
                                        'block px-4 py-2 text-sm text-gray-700 w-full text-left',
                                      )}
                                      onClick={item.onClick}
                                      type="button"
                                    >
                                      {item.title}
                                    </button>
                                  );
                                }}
                              </Menu.Item>
                            ))}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    )}
                </div>
                <div className="-mr-2 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="pt-2 pb-3 space-y-1">
                {links.map((item, ix) => (
                  <Disclosure.Button
                    // eslint-disable-next-line react/no-array-index-key
                    key={ix}
                    as="a"
                    href="#"
                    onClick={item.onClick}
                    className={classNames(
                      item.current
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
                      'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.title}
                  </Disclosure.Button>
                ))}
                {hiddenLinks.map((item, ix) => (
                  <Disclosure.Button
                    // eslint-disable-next-line react/no-array-index-key
                    key={ix}
                    as="a"
                    href="#"
                    onClick={item.onClick}
                    className={classNames(
                      item.current
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
                      'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.title}
                  </Disclosure.Button>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        );
      }}
    </Disclosure>
  );
}

Navbar.defaultProps = {
  showDropdown: false,
};
