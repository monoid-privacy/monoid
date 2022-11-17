import { gql, useMutation, useQuery } from '@apollo/client';
import React from 'react';
import AlertRegion from '../../../../../components/AlertRegion';
import { UserPrimaryKey } from '../../../../../lib/models';

import { GET_PRIMARY_KEYS } from '../../../../../graphql/requests_queries';
import Select from '../../../../../components/Select';

const LINK_PROPERTY = gql`
  mutation LinkKey($propertyId: ID!, $userPrimaryKeyId: ID) {
    linkPropertyToPrimaryKey(propertyId: $propertyId, userPrimaryKeyId: $userPrimaryKeyId) {
      id
      userPrimaryKey {
        id
        name
      }
    }
  }
`;

export default function IdentifierSelect(props: {
  value: string | undefined,
  workspaceId: string,
  propertyId: string
}) {
  const { workspaceId, propertyId, value } = props;
  const [linkProperty] = useMutation(LINK_PROPERTY);
  const { data, loading, error } = useQuery<{
    workspace: { userPrimaryKeys: UserPrimaryKey[] }
  }>(GET_PRIMARY_KEYS, {
    variables: {
      id: workspaceId,
    },
  });

  if (loading) {
    return <div />;
  }

  if (error) {
    return (
      <AlertRegion alertTitle={error.message} />
    );
  }

  return (
    <Select
      onChange={(e) => linkProperty({
        variables: {
          propertyId,
          userPrimaryKeyId: e.target.value !== '' ? e.target.value : null,
        },
      })}
      value={value || ''}
    >
      <option value="">
        {' '}
      </option>
      {data?.workspace.userPrimaryKeys.map((pk) => (
        <option key={pk.id} value={pk.id}>
          {pk.name}
        </option>
      ))}
    </Select>
  );
}
