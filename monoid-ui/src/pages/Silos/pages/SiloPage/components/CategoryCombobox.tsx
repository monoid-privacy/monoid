import {
  gql, useLazyQuery, useMutation,
} from '@apollo/client';
import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { FormatOptionLabelMeta } from 'react-select';
import AlertRegion from '../../../../../components/AlertRegion';
import MultiCombobox from '../../../../../components/MultiCombobox';
import { Category } from '../../../../../lib/models';
import Badge from '../../../../../components/Badge';

const SILO_DATA_SOURCES = gql`
  query SiloDataSources($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      categories {
        id
        name
      }
    }
  }
`;

const UPDATE_CATEGORIES = gql`
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
`;

export default function CategoryCombobox(props: {
  value: string[],
  propertyId: string,
}) {
  const { id } = useParams<{ id: string }>();
  const { value, propertyId } = props;
  const [updateCat] = useMutation(UPDATE_CATEGORIES);
  const [loadData, {
    data, loading, called, error,
  }] = useLazyQuery<{
    workspace: { categories: Category[] }
  }>(SILO_DATA_SOURCES, {
    variables: {
      workspaceId: id,
    },
  });

  const categoryOption = (category: Category, { context }: FormatOptionLabelMeta<Category>) => (
    context === 'menu'
      ? (
        <Badge>
          {category.name}
        </Badge>
      )
      : category.name
  );

  const filter = useCallback(async (v: string) => {
    const { data: resData } = await loadData();
    return resData?.workspace.categories.filter(
      (c) => c.name?.toLowerCase().includes(v.toLowerCase()),
    ) || [];
  }, [loadData]);

  const categoryMap = useMemo(() => {
    if (loading || !called) {
      return {};
    }

    return Object.fromEntries(
      data?.workspace.categories.map((v) => [v.id!, v.name!]) || [],
    );
  }, [loading, data, called]);

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
