import ToastContext from 'contexts/ToastContext';
import Text from 'components/Text';
import React, { useContext } from 'react';
import NewPrimaryKeyForm from 'pages/Identifiers/pages/NewPrimaryKeyPage/components/NewPrimaryKeyForm';
import { ChevronRightIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { BristA } from 'components/Link';
import PageHeader from 'components/PageHeader';
import { useQuery } from '@apollo/client';

import { useParams } from 'react-router-dom';
import { GET_PRIMARY_KEYS } from 'graphql/requests_queries';
import { UserPrimaryKey } from 'lib/models';

export default function UserIdentifierStepBody(props: { onSuccess: () => void }) {
  const { onSuccess } = props;
  const toastCtx = useContext(ToastContext);
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{
    workspace: {
      userPrimaryKeys: UserPrimaryKey[],
    }
  }>(GET_PRIMARY_KEYS, {
    variables: {
      id,
    },
  });

  return (
    <>
      <PageHeader title="Create User Identifier" className="mb-2" />
      <Text className="mb-4" size="sm">
        The core of Brist&apos;s automations are user identifiers. You can use them to
        define the fields of your data sources that can be used to query for user data.
        You&apos;ll have to provide these identifiers when you create a data request.
      </Text>
      {!loading && !error && (data?.workspace.userPrimaryKeys.length || 0) !== 0
        && (
          <BristA
            href="#"
            onClick={() => {
              onSuccess();
            }}
            className="mb-4 text-sm"
          >
            <div className="flex space-x-1 items-center">
              <div>Skip Step</div>
              <ChevronRightIcon className="w-4 h-4" />
            </div>
          </BristA>
        )}
      <NewPrimaryKeyForm
        onSuccess={() => {
          onSuccess();
        }}
        onError={(err) => {
          toastCtx.showToast(
            {
              title: 'Error Creating Identifier',
              message: err.message,
              variant: 'danger',
              icon: XCircleIcon,
            },
          );
        }}
      />
    </>
  );
}
