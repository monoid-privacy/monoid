import { useQuery } from '@apollo/client';
import React from 'react';
import { gql } from '__generated__/gql';
import AlertRegion from '../../../../../components/AlertRegion';
import Badge, { BadgeColor } from '../../../../../components/Badge';
import Spinner from '../../../../../components/Spinner';

const GET_CATEGORY = gql(`
  query GetCategory($id: ID!) {
    category(id: $id) {
      id
      name
    }
  }
`);

export default function CategoryBadge(props: {
  categoryID: string,
  color?: BadgeColor
}) {
  const { categoryID, color } = props;
  const { data, loading, error } = useQuery(GET_CATEGORY, {
    variables: {
      id: categoryID,
    },
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <AlertRegion alertTitle="Error">{error.message}</AlertRegion>
    );
  }

  return (
    <Badge color={color}>
      {data?.category.name!}
    </Badge>
  );
}

CategoryBadge.defaultProps = {
  color: 'blue',
};
