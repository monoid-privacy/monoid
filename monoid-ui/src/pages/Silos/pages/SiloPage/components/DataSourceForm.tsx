import React from 'react';
import Input, { InputLabel } from 'components/Input';
import { DataSource } from 'lib/models';
import Button from 'components/Button';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon } from '@heroicons/react/20/solid';
import CategoryCombobox from './CategoryCombobox';

export default function DataSourceForm(props: {
  value: DataSource,
  onChange: (ds: DataSource) => void
}) {
  const { value, onChange } = props;
  return (
    <div className="space-y-4">
      <div>
        <InputLabel htmlFor="sourceName">
          Data Source Name
        </InputLabel>
        <div className="mt-2">
          <Input
            id="sourceName"
            onChange={(e) => {
              onChange({
                ...value,
                name: e.target.value,
              });
            }}
          />
        </div>
      </div>
      <div>
        <InputLabel htmlFor="property">
          Properties
        </InputLabel>
        <div className="mt-2 space-y-4">
          {
            value.properties?.map((p) => (
              <div className="flex space-x-2">
                <Input key={p.id} placeholder="Property Name" />
                <CategoryCombobox
                  className="w-full"
                  placeholder="Categories"
                  value={p.categories?.map((c) => c.id!) || []}
                  onChange={(cat) => {
                    onChange({
                      ...value,
                      properties: value.properties?.map((prop) => {
                        if (p.id !== prop.id) {
                          return prop;
                        }

                        return {
                          ...prop,
                          categories: cat.map((cid) => ({ id: cid })),
                        };
                      }),
                    });
                  }}
                />
                <Button
                  variant="danger"
                  onClick={() => {
                    onChange({
                      ...value,
                      properties: value.properties?.filter((prop) => p.id !== prop.id),
                    });
                  }}
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            ))
          }
          <Button onClick={() => {
            onChange({
              ...value,
              properties: [
                ...value.properties!,
                {
                  id: uuidv4(),
                  name: '',
                  categories: [],
                },
              ],
            });
          }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
