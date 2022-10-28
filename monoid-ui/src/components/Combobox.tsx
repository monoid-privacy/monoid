import React, { useState } from 'react';
import { Combobox as HUICombobox, Portal } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import usePopper from '../utils/use-popper';
import { classNames } from '../utils/utils';

interface ComboboxProps<T> extends Omit<Omit<Omit<React.HTMLProps<HTMLDivElement>, 'id'>, 'value'>, 'onChange'> {
  value: T | undefined,
  label?: string,
  onChange: (v: T) => void,
  filter: (query: string) => T[],
  id: (v: T) => string,
  displayValue: (v: T) => string,
}

export default function Combobox<T>(props: ComboboxProps<T>) {
  const [query, setQuery] = useState<string>('');
  const {
    value, label, onChange, filter, id, displayValue, className,
    disabled,
  } = props;
  const opts = filter(query);

  const [trigger, container] = usePopper({
    placement: 'bottom-end',
    strategy: 'fixed',
    modifiers: [
      {
        name: 'sameWidth',
        enabled: true,
        fn: ({ state }: any) => {
          // eslint-disable-next-line no-param-reassign
          state.styles.popper.width = `${state.rects.reference.width}px`;
        },
        requires: ['computeStyles'],
        phase: 'beforeWrite',
      }, {
        name: 'offset',
        options: {
          offset: [0, 5],
        },
      },
    ],
  });

  return (
    <HUICombobox
      as="div"
      value={value}
      onChange={(v: T) => {
        onChange(v);
        setQuery('');
      }}
      className={className}
      disabled={disabled}
    >
      {label && <HUICombobox.Label className="block text-sm font-medium text-gray-700">{label}</HUICombobox.Label>}
      <div className="relative mt-1">
        <HUICombobox.Input<'input', T>
          className={
            classNames(
              'w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm',
            )
          }
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(v) => (v ? displayValue(v) : '')}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          ref={trigger}
        />
        <HUICombobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </HUICombobox.Button>

        <Portal>
          {opts.length > 0 && (
            <HUICombobox.Options
              className="absolute z-10 mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
              ref={container}
            >
              {opts.map((v) => (
                <HUICombobox.Option
                  key={id(v)}
                  value={v}
                  className={({ active }) => classNames(
                    'relative cursor-default select-none py-2 pl-3 pr-9',
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                  )}
                >
                  {({ active, selected }) => (
                    <>
                      <span className={classNames('block truncate', selected ? 'font-semibold' : '')}>
                        {displayValue(v)}
                      </span>

                      {selected && (
                        <span
                          className={classNames(
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                            active ? 'text-white' : 'text-indigo-600',
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </HUICombobox.Option>
              ))}
            </HUICombobox.Options>
          )}
        </Portal>
      </div>
    </HUICombobox>

  );
}

Combobox.defaultProps = {
  label: null,
};
