import {
  ApolloError, useMutation, useQuery,
} from '@apollo/client';
import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { gql } from '__generated__/gql';
import LoadingPage from '../../common/LoadingPage';
import AlertRegion from '../../components/AlertRegion';
import Card from '../../components/Card';
import Input, { InputLabel } from '../../components/Input';
import PageHeader from '../../components/PageHeader';
import Toggle from '../../components/Toggle';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ToastContext from '../../contexts/ToastContext';

const GET_SETTINGS = gql(`
  query GetSettings($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      settings
    }
  }
`);

const UPDATE_SETTINGS = gql(`
  mutation UpdateSettings($input: UpdateWorkspaceSettingsInput!) {
    updateWorkspaceSettings(input: $input) {
      id
      settings
    }
  }
`);

type Settings = {
  email: string,
  sendNews: boolean
};

function SettingsForm(props: {
  defaultValues: Settings
}) {
  const { id } = useParams<{ id: string }>();
  const { defaultValues } = props;
  const [settings, setSettings] = useState<Settings>({
    email: '',
    sendNews: true,
  });
  const [updateSettings, updateSettingsRes] = useMutation(UPDATE_SETTINGS);
  const toastCtx = useContext(ToastContext);

  useEffect(() => {
    setSettings(defaultValues);
  }, [defaultValues]);

  return (
    <>
      <div>
        <InputLabel htmlFor="email" className="mb-2">
          Email
        </InputLabel>
        <Input
          value={settings.email}
          id="email"
          onChange={(e) => {
            setSettings({
              ...settings,
              email: e.target.value,
            });
          }}
        />
      </div>
      <div className="mt-3">
        <InputLabel htmlFor="news">
          Recieve News
        </InputLabel>
        <div className="mt-2 sm:flex sm:items-center">
          <Toggle
            checked={settings.sendNews}
            onChange={(v) => {
              setSettings({
                ...settings,
                sendNews: v,
              });
            }}
            size="lg"
          />
          <Text size="sm" className="ml-3" em={settings.sendNews ? 'normal' : 'light'}>
            Recieve Emails with News from Monoid
          </Text>
        </div>
      </div>
      <Button
        className="ml-auto mt-6"
        onClick={() => {
          updateSettings({
            variables: {
              input: {
                workspaceID: id!,
                settings: [
                  { key: 'email', value: settings.email },
                  { key: 'sendNews', value: settings.sendNews ? 't' : 'f' },
                ],
              },
            },
          }).then(() => {
            toastCtx.showToast({
              title: 'Success',
              message: 'Settings Saved',
              variant: 'success',
              icon: CheckCircleIcon,
            });
          }).catch((err: ApolloError) => {
            toastCtx.showToast({
              title: 'Error',
              message: err.message,
              variant: 'danger',
              icon: XCircleIcon,
            });
          });
        }}
      >
        {updateSettingsRes.loading ? <Spinner /> : 'Save'}
      </Button>

    </>
  );
}

function SettingsFormWrapper() {
  const { id } = useParams<{ id: string }>();

  const { data, loading, error } = useQuery(GET_SETTINGS, {
    variables: {
      workspaceId: id!,
    },
  });

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <AlertRegion alertTitle="Error">{error.message}</AlertRegion>;
  }

  return <SettingsForm defaultValues={data?.workspace.settings} />;
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <Card>
        <SettingsFormWrapper />
      </Card>
    </>
  );
}
