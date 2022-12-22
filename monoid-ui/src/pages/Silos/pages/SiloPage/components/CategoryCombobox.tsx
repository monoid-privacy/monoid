import { useLazyQuery } from '@apollo/client';
import AlertRegion from 'components/AlertRegion';
import Badge from 'components/Badge';
import MultiCombobox from 'components/MultiCombobox';
import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { FormatOptionLabelMeta } from 'react-select';
import { Category } from '__generated__/graphql';
import { gql } from '__generated__/gql';

const WORKSPACE_CATEGORIES = gql(`
  query WorkspaceCategories($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      categories {
        id
        name
      }
    }
  }
`);

export default function CategoryCombobox(props: {
  value: string[],
  onChange: (v: string[]) => void,
  className?: string,
  placeholder?: string,
}) {
  const { id } = useParams<{ id: string }>();
  const {
    value, onChange, className, placeholder,
  } = props;
  const [loadData, {
    data, loading, called, error,
  }] = useLazyQuery(WORKSPACE_CATEGORIES, {
    variables: {
      workspaceId: id!,
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
      placeholder={placeholder}
      className={className}
      value={value.map((v) => ({
        id: v,
        name: categoryMap[v] || '',
      }))}
      onChange={(v) => {
        onChange(v.map((vl) => vl.id!));
      }}
      filter={filter}
      id={(v) => `${v.id}`}
      displayNode={categoryOption}
      menuPortalTarget={document.body}
      isMulti
    />
  );
}

CategoryCombobox.defaultProps = {
  className: undefined,
  placeholder: undefined,
};
