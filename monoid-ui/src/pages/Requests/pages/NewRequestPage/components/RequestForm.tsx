import React, { useEffect, useState } from 'react';
import AlertRegion from '../../../../../components/AlertRegion';
import Button from '../../../../../components/Button';
import { InputLabel } from '../../../../../components/Input';
import Spinner from '../../../../../components/Spinner';
import { PrimaryKeyValue, Request } from '../../../../../lib/models';
import RequestsCombobox from './RequestsCombobox';

interface RequestFormData {
  type: string,
  primaryKeys: PrimaryKeyValue[]
}

export default function RequestForm(props: {
  onSubmit: (req: RequestFormData) => void,
  defaultRequest?: Request,
  loading?: boolean,
  error?: Error,
}) {
  const {
    onSubmit, loading, defaultRequest, error,
  } = props;
  const [req, setReq] = useState<RequestFormData>({
    type: '',
    primaryKeys: [],
  });
  useEffect(() => {
    if (!defaultRequest) {
      return;
    }

    setReq({
      type: defaultRequest.type!,
      primaryKeys: defaultRequest.primaryKeyValues!,
    });
  }, [defaultRequest]);

  return (
    <div className="space-y-6">
      <div>
        <InputLabel htmlFor="dataSilo">
          Request Type
        </InputLabel>
        <div className="mt-2">
          <RequestsCombobox
            value={req.type}
            setValue={(v) => {
              setReq({
                ...req,
                type: v,
              });
            }}
          />
        </div>
      </div>

      {
        error && (
          <div>
            <AlertRegion alertTitle="Error Connecting Silo">
              {error.message}
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
          {loading ? <Spinner /> : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

RequestForm.defaultProps = {
  defaultRequest: undefined,
  loading: false,
  error: undefined,
};
