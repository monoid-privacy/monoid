import React from 'react';
import AsyncSelect from 'react-select/async';
import { StyledSelectInput } from './TextMultiInput';

interface BaseComboboxProps<T> extends Omit<Omit<Omit<React.HTMLProps<HTMLDivElement>, 'id'>, 'value'>, 'onChange'> {
  filter: (query: string) => T[],
  id: (v: T) => string,
  displayNode: (v: T) => React.ReactNode,
  menuPortalTarget?: HTMLElement | null
}

type ComboboxProps<T> = ({
  value: T[] | undefined,
  onChange: (v: readonly T[]) => void,
  isMulti: true
} | {
  value: T | undefined,
  onChange: (v?: T | null) => void,
  isMulti: false | undefined
}) & BaseComboboxProps<T>;

export default function Combobox<T>(props: ComboboxProps<T>) {
  const {
    value, onChange, filter, id, displayNode, className, isMulti, menuPortalTarget,
  } = props;

  if (isMulti) {
    return (
      <AsyncSelect
        components={{
          Input: StyledSelectInput,
        }}
        loadOptions={(v, cb) => cb(filter(v))}
        value={value}
        formatOptionLabel={(v) => displayNode(v)}
        getOptionValue={(v) => id(v)}
        onChange={(v) => onChange(v)}
        className={className}
        menuPortalTarget={menuPortalTarget}
        isMulti
      />
    );
  }

  return (
    <AsyncSelect
      components={{
        Input: StyledSelectInput,
      }}
      loadOptions={(v, cb) => cb(filter(v))}
      value={value}
      formatOptionLabel={(v) => displayNode(v)}
      getOptionValue={(v) => id(v)}
      onChange={(v) => onChange(v)}
      menuPortalTarget={menuPortalTarget}
    />
  );
}

Combobox.defaultProps = {
  menuPortalTarget: undefined,
};
