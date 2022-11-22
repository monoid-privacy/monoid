/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { Popover, Transition } from '@headlessui/react';
import {
  CheckIcon, ChevronRightIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import React, {
  Fragment, ReactNode, useMemo, useState,
} from 'react';
import { classNames } from '../utils/utils';
import Badge from './Badge';
import Button from './Button';

type FilterOption = {
  key: string
  content: React.ReactNode
};

type FilterSpec = {
  name: string
  options: FilterOption[]
  formatTag: (v: FilterValue) => React.ReactNode
};

export type FilterValue = {
  name: string
  value: string[]
};

function EaseTransition(props: { children: ReactNode }) {
  const { children } = props;
  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      {children}
    </Transition>
  );
}

export default function FilterRegion(props: {
  filterOptions: FilterSpec[],
  value: FilterValue[],
  onChange: (v: FilterValue[]) => void
  children: React.ReactNode
}) {
  const {
    value, filterOptions, onChange, children,
  } = props;
  const [newValue, setNewValue] = useState<FilterValue | undefined>();

  const filterOptionsMap = useMemo(() => (
    Object.fromEntries(filterOptions.map((f) => [f.name, f]))
  ), [value]);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {
        value.map((v, inx) => (
          <Badge
            color="white"
            key={v.name}
            actions={[
              {
                onClick() {
                  onChange(value.filter((_, finx) => finx !== inx));
                },
                content: <XMarkIcon className="w-3" />,
                key: 'del',
              },
            ]}
          >
            <div className="flex space-x-1 items-center">
              <div>
                {v.name}
              </div>
              <div>
                {filterOptionsMap[v.name].formatTag(v)}
              </div>
            </div>
          </Badge>
        ))
      }
      <Popover as="div" className="relative inline-block text-left">
        <div>
          <Popover.Button className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none">
            {children}
          </Popover.Button>
        </div>

        <EaseTransition>
          <Popover.Panel className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <ul className="divide-y divide-gray-200">
              <Popover.Group>
                {filterOptions.map((item, ix) => (
                  <Popover as="ul" className="relative inline-block text-left w-full divide-y divide-gray-200" key={item.name}>
                    {({ open, close }) => (
                      <>
                        <Popover.Button
                          as="li"
                          key={item.name}
                          className={classNames(
                            'px-4 py-2 text-sm flex items-center cursor-pointer hover:bg-gray-200',
                            ix === 0 ? 'rounded-t-md' : '',
                            ix === filterOptions.length - 1 ? 'rounded-b-md' : '',
                            open ? 'bg-gray-300' : '',
                          )}
                          onClick={() => {
                            setNewValue({
                              name: item.name,
                              value: [],
                            });
                          }}
                        >
                          <div>
                            {item.name}
                          </div>
                          <div className="ml-auto text-gray-400">
                            <ChevronRightIcon className="h-4 w-4" />
                          </div>
                        </Popover.Button>
                        <EaseTransition>
                          <Popover.Panel className={
                            classNames(
                              'absolute top-0 left-full z-10 ml-2 w-64 origin-top-left',
                              'rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5',
                              'focus:outline-none p-3 flex flex-col',
                              'max-h-64',
                            )
                          }
                          >
                            <Button onClick={() => {
                              if (!newValue) {
                                return;
                              }

                              onChange([
                                ...value,
                                newValue,
                              ]);
                              close();
                            }}
                            >
                              Add Filters
                            </Button>
                            <ul className="divide-y divide-gray-200 mt-2 flex-shrink-1 min-h-0 overflow-scroll">
                              {
                                item.options.map((o) => {
                                  const active = newValue?.value.includes(o.key);
                                  return (
                                    <li
                                      key={o.key}
                                      className="px-4 py-2 text-sm hover:bg-gray-200 cursor-pointer flex items-center"
                                      onClick={() => {
                                        const nv = {
                                          ...newValue,
                                          name: item.name,
                                          value: !active ? [...(newValue?.value || []), o.key] : (
                                            newValue?.value.filter((v) => v !== o.key) || []
                                          ),
                                        };

                                        setNewValue(nv);
                                      }}
                                    >
                                      <div className="w-4 h-4 mr-3">
                                        {active && <CheckIcon />}
                                      </div>
                                      <div>{o.content}</div>
                                    </li>
                                  );
                                })
                              }
                            </ul>
                          </Popover.Panel>
                        </EaseTransition>
                      </>
                    )}
                  </Popover>
                ))}
              </Popover.Group>
            </ul>
          </Popover.Panel>
        </EaseTransition>
      </Popover>
    </div>
  );
}
