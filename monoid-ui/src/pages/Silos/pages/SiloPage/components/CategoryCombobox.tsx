import { gql, useMutation, useQuery } from '@apollo/client';
import React, { useCallback, useMemo } from 'react';
import AlertRegion from '../../../../../components/AlertRegion';
import MultiCombobox from '../../../../../components/MultiCombobox';
import { Category } from '../../../../../lib/models';
import Text from '../../../../../components/Text';

const SILO_DATA_SOURCES = gql`
  query SiloDataSources {
    categories {
      id
      name
    }
  }
`;

const UPDATE_CATEGORIES = gql`
  mutation UpdateCategories($input: UpdatePropertyInput!) {
    updateProperty(input: $input) {
      id
      categories {
        id
        name
      }
    }
  }
`;

export default function CategoryCombobox(props: {
  value: string[],
  propertyId: string,
}) {
  const { value, propertyId } = props;
  const [updateCat] = useMutation(UPDATE_CATEGORIES);
  const { data, loading, error } = useQuery<{ categories: Category[] }>(SILO_DATA_SOURCES);
  const categoryOption = (category: Category) => (
    <Text size="sm">
      {category.name}
    </Text>
  );

  const filter = useCallback((v: string) => {
    if (loading) {
      return [];
    }

    return data?.categories.filter((c) => c.name?.toLowerCase().includes(v.toLowerCase())) || [];
  }, [loading, data]);

  const categoryMap = useMemo(() => {
    if (loading) {
      return {};
    }

    return Object.fromEntries(data?.categories.map((v) => [v.id!, v.name!]) || []);
  }, [loading, data]);

  if (error) {
    return (
      <AlertRegion alertTitle={error.message} />
    );
  }

  return (
    <MultiCombobox<Category>
      value={value.map((v) => ({
        id: v,
        name: categoryMap[v] || '',
      }))}
      onChange={(v) => {
        console.log('Change', v);
        updateCat({
          variables: {
            input: {
              id: propertyId,
              categoryIDs: v.map((vl) => vl.id!),
            },
          },
        });
      }}
      filter={filter}
      id={(v) => `${v.id}`}
      displayNode={categoryOption}
      menuPortalTarget={document.body}
      isMulti
    />
  );
}
