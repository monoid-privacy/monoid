import React, { KeyboardEventHandler } from 'react';

import CreatableSelect from 'react-select/creatable';
import { components } from 'react-select';
import { classNames } from '../utils/utils';

export function StyledSelectInput(props: any) {
  const { className, type, ...rest } = props;

  return (
    <components.Input
      {...rest}
      className={classNames(
        'outline-none border-none shadow-none focus:ring-transparent sm:text-sm',
        className,
      )}
    />
  );
}

export default function TextMultiInput(props: {
  value: string[],
  onChange: (v: string[]) => void,
  placeholder?: string
}) {
  const { value, onChange, placeholder } = props;
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) return;
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        onChange([...value, inputValue]);
        setInputValue('');
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  return (
    <CreatableSelect
      components={{
        DropdownIndicator: null,
        Input: StyledSelectInput,
      }}
      inputValue={inputValue}
      isClearable
      isMulti
      menuIsOpen={false}
      onChange={(newValue) => onChange(newValue.map((n) => n.value))}
      onInputChange={(newValue) => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      value={value.map((v) => ({ label: v, value: v }))}
      styles={{
        input: (css) => ({
          ...css,
          input: {
            outline: 'none',
          },
        }),
      }}
    />
  );
}

TextMultiInput.defaultProps = {
  placeholder: undefined,
};
