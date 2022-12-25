import { useQuery } from '@apollo/client';
import React, { useEffect, useMemo } from 'react';
import { gql } from '__generated__/gql';
import Spinner from '../../../../../components/Spinner';
import Input, { InputLabel } from '../../../../../components/Input';
import { MonoidJSONSchema } from '../../../../../lib/types';
import Toggle from '../../../../../components/Toggle';
import TextMultiInput from '../../../../../components/TextMultiInput';
import BorderedRegion from '../../../../../components/BorderedRegion';
import Button from '../../../../../components/Button';

const SILO_SPECIFICATION = gql(`
  query GetSiloSpec($id: ID!) {
    siloSpecification(id: $id) {
      id
      schema
    }
  }
`);

const cmp = (v1?: number, v2?: number) => {
  const v1c = v1 === undefined ? 1000 : v1;
  const v2c = v2 === undefined ? 1000 : v2;

  return v1c - v2c;
};

const buildDefaultObject: (def: MonoidJSONSchema) => any = (def: MonoidJSONSchema) => {
  if (def.default) {
    return def.default;
  }

  switch (def.type) {
    case 'array':
      return [];
    case 'boolean':
      return false;
    case 'integer':
      return 0;
    case 'number':
      return 0;
    case 'object':
      return Object.fromEntries(
        Object.keys(def.properties!).map((k) => (
          { k, v: def.properties![k] as MonoidJSONSchema }
        )).map(({ k, v }) => (
          [k, buildDefaultObject(v)]
        )),
      );
    case 'string':
      return '';
    default:
      return null;
  }

  return null;
};

function JSONSchemaControl(
  props: {
    def: MonoidJSONSchema,
    value: any,
    onChange: (v: any) => void,
    root?: boolean
  },
) {
  const {
    def, value, onChange, root,
  } = props;

  if (def.secret && value === undefined) {
    return (
      <Button onClick={() => {
        onChange(buildDefaultObject(def));
      }}
      >
        Edit
      </Button>
    );
  }

  switch (def.type) {
    case 'string':
      return (
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          type={def.secret ? 'password' : undefined}
        />
      );
    case 'integer':
      return (
        <Input
          value={value}
          onChange={(e) => {
            onChange(parseInt(e.target.value, 10));
          }}
          type="number"
        />
      );
    case 'number':
      return (
        <Input
          value={value}
          onChange={(e) => {
            onChange(parseFloat(e.target.value));
          }}
          type="number"
        />
      );
    case 'boolean':
      return (
        <Toggle
          checked={value}
          onChange={(v) => {
            onChange(v);
          }}
          size="lg"
        />
      );
    case 'array':
      switch ((def.items as MonoidJSONSchema).type) {
        case 'string':
          return (
            <TextMultiInput
              value={value ? value as string[] : []}
              onChange={(n) => onChange(n)}
              placeholder=""
            />
          );
        default:
          return <div />;
      }
      break;
    case 'object': {
      const fields = (
        Object.keys(def.properties!).map((k) => (
          { k, v: def.properties![k] as MonoidJSONSchema }
        )).sort((o1, o2) => cmp(o1.v.order, o2.v.order)).map(({ k, v }) => (
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          <JSONSchemaField
            def={v as MonoidJSONSchema}
            value={value ? value[k] : undefined}
            onChange={(val) => {
              onChange({
                ...value,
                [k]: val,
              });
            }}
            key={k}
          />
        ))
      );

      if (root) {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{fields}</>;
      }
      return (
        <BorderedRegion label={def.title || 'No Name Provided'}>
          <div className="space-y-6">
            {fields}
          </div>
        </BorderedRegion>
      );
    }
    default:
      return (
        <div>
          Unsupported type
        </div>
      );
  }
}

JSONSchemaControl.defaultProps = {
  root: false,
};

const fillSecretVals: (def: MonoidJSONSchema, val: any) => any = (def, val) => {
  switch (def.type) {
    case 'array':
    case 'boolean':
    case 'integer':
    case 'string':
    case 'number':
      if (def.secret) {
        return undefined;
      }
      return val;
    case 'object':
      return Object.fromEntries(
        Object.keys(def.properties!).map((k) => (
          { k, v: def.properties![k] as MonoidJSONSchema }
        )).map(({ k, v }) => (
          [k, fillSecretVals(v, val[k])]
        )),
      );

    default:
      return null;
  }

  return null;
};

function JSONSchemaField(
  props: {
    def: MonoidJSONSchema,
    value: any,
    onChange: (v: any) => void
  },
) {
  const { def, value, onChange } = props;

  return (
    <div>
      <InputLabel htmlFor="siloName">
        {def.title}
      </InputLabel>
      <div className="mt-2">
        <JSONSchemaControl
          def={def}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function SiloFields(props: {
  siloID: string,
  siloData: any,
  setSiloData: (v: any) => void,
  prefilled?: boolean
}) {
  const {
    siloID, siloData, setSiloData, prefilled,
  } = props;
  const { data, loading, error } = useQuery(SILO_SPECIFICATION, {
    variables: {
      id: siloID,
    },
  });

  const jsonSchema = useMemo(() => {
    if (!data?.siloSpecification.schema) {
      return undefined;
    }

    try {
      const schema = JSON.parse(data?.siloSpecification.schema) as MonoidJSONSchema;
      return schema;
    } catch {
      return undefined;
    }
  }, [data?.siloSpecification]);

  useEffect(() => {
    if (!jsonSchema) {
      return;
    }

    if (!prefilled) {
      setSiloData(buildDefaultObject(jsonSchema));
    } else {
      setSiloData(fillSecretVals(jsonSchema, siloData));
    }
  }, [jsonSchema, prefilled]);

  if (error) {
    return (
      <div>{error.message}</div>
    );
  }

  if (loading || !jsonSchema) {
    return <Spinner />;
  }

  return (
    <JSONSchemaControl def={jsonSchema} value={siloData} onChange={(v) => setSiloData(v)} root />
  );
}

SiloFields.defaultProps = {
  prefilled: false,
};
