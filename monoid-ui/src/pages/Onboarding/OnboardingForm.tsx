import React, { useContext, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/outline';
import Button from '../../components/Button';
import { H2 } from '../../components/Headers';
import Input, { InputLabel } from '../../components/Input';
import Toggle from '../../components/Toggle';
import Text from '../../components/Text';
import logo from '../../logo.svg';
import Card from '../../components/Card';
import PageCenter from '../../components/PageCenter';
import Spinner from '../../components/Spinner';
import ToastContext from '../../contexts/ToastContext';

const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      id
    }
  }
`;

export default function OnboardingForm() {
  const [formData, setFormData] = useState({
    email: '',
    news: true,
    analytics: false,
  });

  const [createWorkspace, createWorkspaceRes] = useMutation(CREATE_WORKSPACE);
  const navigate = useNavigate();
  const toastCtx = useContext(ToastContext);

  return (
    <PageCenter>
      <Card>
        <form
          className="flex flex-col"
        >
          <img src={logo} alt="Monoid Logo" className="h-20" />
          <H2 className="self-center my-3">
            Welcome to Monoid
          </H2>
          <div>
            <InputLabel htmlFor="email">
              Email
            </InputLabel>
            <div className="mt-2 sm:flex sm:items-center">
              <Input
                placeholder="you@example.com"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  });
                }}
                value={formData.email}
              />
            </div>
          </div>
          <div className="mt-3">
            <InputLabel htmlFor="news">
              Recieve News
            </InputLabel>
            <div className="mt-2 sm:flex sm:items-center">
              <Toggle
                checked={formData.news}
                onChange={(v) => {
                  setFormData({
                    ...formData,
                    news: v,
                  });
                }}
                size="lg"
              />
              <Text size="sm" className="ml-3" em={formData.news ? 'normal' : 'light'}>
                Recieve Emails with News from Monoid
              </Text>
            </div>
          </div>
          <div className="mt-3">
            <InputLabel htmlFor="analytics">
              Anonymize Product Analytics
            </InputLabel>
            <div className="mt-2 sm:flex sm:items-center">
              <Toggle
                checked={formData.analytics}
                onChange={(v) => {
                  setFormData({
                    ...formData,
                    analytics: v,
                  });
                }}
                size="lg"
              />
              <Text size="sm" className="ml-3" em={formData.analytics ? 'normal' : 'light'}>
                Anonymize your usage
              </Text>
            </div>
          </div>
          <Button
            className="mt-3"
            onClick={() => {
              createWorkspace({
                variables: {
                  input: {
                    name: formData.email,
                    settings: [
                      { key: 'email', value: formData.email },
                      { key: 'anonymizeData', value: formData.analytics ? 't' : 'f' },
                      { key: 'sendNews', value: formData.news ? 't' : 'f' },
                    ],
                  },
                },
              }).then(({ data }) => {
                navigate(`/workspaces/${data.createWorkspace.id}`);
              }).catch((err) => {
                toastCtx.showToast(
                  {
                    title: 'Error Creating Workspace',
                    message: err.message,
                    variant: 'danger',
                    icon: XCircleIcon,
                  },
                );
              });
            }}
          >
            {createWorkspaceRes.loading ? <Spinner /> : 'Continue'}
          </Button>
        </form>
      </Card>
    </PageCenter>
  );
}
