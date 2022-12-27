import {
  useMutation,
} from '@apollo/client';
import React from 'react';
import { gql } from '__generated__/gql';
import CategoryCombobox from './CategoryCombobox';

const UPDATE_CATEGORIES = gql(`
  mutation UpdateCategories($input: UpdatePropertyInput!) {
    updateProperty(input: $input) {
      __typename
      id
      categories {
        id
        name
      }
    }
  }
`);

export default function PropertyCategoryCombobox(props: {
  value: string[],
  propertyId: string,
}) {
  const { value, propertyId } = props;
  const [updateCat] = useMutation(UPDATE_CATEGORIES);

  return (
    <CategoryCombobox
      value={value}
      onChange={(v) => {
        updateCat({
          variables: {
            input: {
              id: propertyId,
              categoryIDs: v,
            },
          },
        });
      }}
    />
  );
}
