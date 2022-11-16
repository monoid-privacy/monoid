import React from 'react';
import Select from '../../../../../components/Select';

export default function SourcesCombobox(props: {
  value: string | undefined,
  setValue: (s: string) => void
}) {
  const { value, setValue } = props;

  const values = ['query', 'delete'];
  return (
    <Select
      value={(values.find((ss: string) => ss === value))}
      onChange={(v) => { setValue(v.target.value); }}
    >
      <option value="query">Query</option>
      <option value="delete">Delete</option>
    </Select>
  );
}
