import React, { useState } from 'react';
import AlertRegion from '../../../../../components/AlertRegion';
import Button from '../../../../../components/Button';
import Input, { InputLabel } from '../../../../../components/Input';
import Spinner from '../../../../../components/Spinner';
import Select from '../../../../../components/Select';
import {
  UserPrimaryKey, UserDataRequestInput,
} from '../../../../../lib/models';

function PrimaryKeyInputs(props: {
  userPrimaryKey: UserPrimaryKey,
  onChange: (v: any) => void,
  value: string | undefined,
}) {
  const { userPrimaryKey, onChange, value } = props;

  return (
    <>
      <InputLabel className="mb-2">{userPrimaryKey.name}</InputLabel>
      <Input
        value={value}
        onChange={onChange}
      />
    </>
  );
}

export default function RequestForm(props: {
  onSubmit: (req: UserDataRequestInput) => void,
  userPrimaryKeys?: UserPrimaryKey[],
  formLoading?: boolean,
  formError?: Error,
}) {
  const {
    onSubmit, formLoading, formError, userPrimaryKeys,
  } = props;

  const [req, setReq] = useState<UserDataRequestInput>({
    type: 'QUERY',
    primaryKeys: userPrimaryKeys!.map((key) => ({
      apiIdentifier: key.apiIdentifier,
      value: '',
    })),
  });

  return (
    <div className="space-y-6">
      <div>
        <InputLabel htmlFor="dataSilo">
          Request Type
        </InputLabel>
        <div className="mt-2">
          <Select
            value={req.type}
            onChange={(v) => {
              setReq({
                ...req,
                type: v.target.value,
              });
            }}
          >
            <option value="QUERY">Query</option>
            <option value="DELETE">Delete</option>
          </Select>
        </div>
      </div>
      {
        req.primaryKeys!.map((key, i) => (
          <div>
            <PrimaryKeyInputs
              userPrimaryKey={userPrimaryKeys![i]}
              value={req.primaryKeys![i].value!}
              onChange={(v) => {
                const pk = [...req.primaryKeys!];
                pk[i] = {
                  apiIdentifier: key.apiIdentifier,
                  value: v.target.value,
                };
                setReq({
                  ...req,
                  primaryKeys: pk,
                });
              }}
            />
          </div>
        ))
      }
      {
        formError && (
          <div>
            <AlertRegion alertTitle="Error Connecting Silo">
              {formError?.message}
            </AlertRegion>
          </div>
        )
      }

      <div>
        <Button
          className="justify-center"
          onClick={() => {
            onSubmit(req);
          }}
        >
          {formLoading ? <Spinner /> : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

RequestForm.defaultProps = {
  formLoading: false,
  formError: undefined,
  userPrimaryKeys: [],
};
