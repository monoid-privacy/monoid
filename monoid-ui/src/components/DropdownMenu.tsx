import { Menu, Transition } from '@headlessui/react';
import React from 'react';
import { classNames } from 'utils/utils';
import { NavLink } from './nav/types';

export default function DropdownMenu(props: {
  children?: React.ReactNode,
  items: NavLink[],
}) {
  const { children, items } = props;
  return (
    <Menu as="div" className="ml-3 relative">
      <div>
        <Menu.Button as={React.Fragment}>
          {children}
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
          {items.map((item, ix) => (
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
  );
}

DropdownMenu.defaultProps = {
  children: undefined,
};
