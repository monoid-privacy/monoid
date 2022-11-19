import {
  ApolloError, gql, useMutation, useQuery,
} from '@apollo/client';
import React, {
  useContext, useEffect, useState,
} from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  BellAlertIcon,
  CheckCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import AlertRegion from '../../../../../components/AlertRegion';
import Card, { CardHeader, CardDivider } from '../../../../../components/Card';
import Spinner from '../../../../../components/Spinner';
import {
  DataDiscovery,
} from '../../../../../lib/models';
import Badge from '../../../../../components/Badge';
import Button from '../../../../../components/Button';
import ToastContext from '../../../../../contexts/ToastContext';
import Pagination from '../../../../../components/Pagination';
import { GET_DISCOVERIES } from '../../../../../graphql/discovery_query';
import DataDiscoveryRow from './DataDiscoveryRow';
import Input from '../../../../../components/Input';
import EmptyState from '../../../../../components/Empty';
import ScanButtonRegion from './ScanButton';

const GET_NUM_ACTIVE_DISCOVERIES = gql`
  query GetNumActiveDiscoveries($id: ID!, $workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      siloDefinition(id: $id) {
        id
        discoveries(limit: 1, offset: 0, statuses: [OPEN]) {
          numDiscoveries
        }
      }
    }
  }
`;

const APPLY_ALL_DISCOVERIES = gql`
  mutation ApplyAllDiscoveries($input: HandleAllDiscoveriesInput!) {
    handleAllOpenDiscoveries(input: $input) {
      id
      status
    }
  }
`;

const limit = 10;

export function SiloAlertsTabHeader() {
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const { data, loading, error } = useQuery(GET_NUM_ACTIVE_DISCOVERIES, {
    variables: {
      id: siloId,
      workspaceId: id,
    },
  });

  let badge: React.ReactNode;

  if (!loading && !error
    && data.workspace.siloDefinition.discoveries.numDiscoveries !== 0) {
    badge = (
      <Badge size="sm">
        {data.workspace.siloDefinition.discoveries.numDiscoveries}
      </Badge>
    );
  }

  return (
    <div className="flex space-x-2">
      <div>Alerts</div>
      {' '}
      {badge}
    </div>
  );
}

function SiloCardBody(props: { query?: string }) {
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const { query } = props;
  const toastCtx = useContext(ToastContext);

  const [offset, setOffset] = useState(0);
  const vars = {
    id: siloId,
    workspaceId: id,
    query: query && query.trim() !== '' ? query : undefined,
    statuses: [],
    limit,
    offset,
  };
  const {
    data, loading, error, fetchMore, refetch,
  } = useQuery(GET_DISCOVERIES, {
    variables: vars,
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <AlertRegion alertTitle="Error">
        {error.message}
      </AlertRegion>
    );
  }

  if (data.workspace.siloDefinition.discoveries.discoveries.length === 0) {
    return (
      <EmptyState
        icon={BellAlertIcon}
        title="No Alerts"
        subtitle="Alerts will be created when you run a scan."
        action={(
          <ScanButtonRegion
            siloId={siloId!}
            workspaceId={id!}
            onScanStatusChange={(s) => {
              if (s === 'COMPLETED') {
                refetch();
                toastCtx.showToast({
                  variant: 'success',
                  title: 'Scan Complete',
                  message: 'Data silo has finished scanning sources.',
                  icon: CheckCircleIcon,
                });
              }
            }}
          >
            Scan
          </ScanButtonRegion>
        )}
        className="pb-5"
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-gray-200">
        {
          data.workspace.siloDefinition.discoveries.discoveries.map((d: DataDiscovery) => (
            <DataDiscoveryRow key={d.id!} discovery={d} />
          ))
        }
      </ul>
      <Pagination
        className="mt-5 sm:-mb-6 -mb-5"
        limit={limit}
        offset={offset}
        onOffsetChange={(o) => {
          fetchMore({
            variables: {
              offset: o,
            },
          }).then(() => {
            setOffset(o);
          });
        }}
        totalCount={data?.workspace.siloDefinition.discoveries.numDiscoveries || 0}
      />
    </>
  );
}

SiloCardBody.defaultProps = {
  query: undefined,
};

function ApplyAlertsButton() {
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const toastCtx = useContext(ToastContext);

  const {
    data, loading, error, refetch,
  } = useQuery(GET_NUM_ACTIVE_DISCOVERIES, {
    variables: {
      id: siloId,
      workspaceId: id,
    },
  });

  const [handleDiscoveries, handleDiscoveriesRes] = useMutation(APPLY_ALL_DISCOVERIES, {
    variables: {
      input: {
        siloId,
        action: 'ACCEPT',
      },
    },
    update: (cache, res) => {
      (res.data.handleAllOpenDiscoveries as DataDiscovery[]).forEach((v) => {
        cache.modify({
          id: cache.identify(v),
          fields: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            status(_currStatus) {
              return v.status;
            },
          },
        });
      });
    },
  });

  const numDiscoveries = data?.workspace.siloDefinition.discoveries.numDiscoveries;
  if (loading || error || numDiscoveries === 0) {
    return <div />;
  }

  if (error) {
    return <div />;
  }

  return (
    <Button
      className="ml-auto"
      onClick={() => handleDiscoveries().then(() => {
        toastCtx.showToast({
          title: 'Success',
          message: 'Applied alerts!',
          variant: 'success',
          icon: CheckCircleIcon,
        });
        refetch();
      }).catch((err: ApolloError) => {
        toastCtx.showToast({
          title: 'Error',
          message: err.message,
          variant: 'danger',
          icon: XCircleIcon,
        });
      })}
    >
      {
        handleDiscoveriesRes.loading ? <Spinner /> : (
          <>
            Apply All Open Alerts (
            {numDiscoveries}
            )
          </>
        )
      }

    </Button>
  );
}

export default function SiloAlerts() {
  const [query, setQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(location.search);
    const q = urlSearchParams.get('query');
    if (q && q.trim() !== '') {
      setQuery(q);
    }
  }, [location.search]);

  return (
    <Card>
      <CardHeader className="flex items-center">
        <div>
          Alerts
        </div>
        {query.trim() === '' ? <ApplyAlertsButton /> : <div />}
      </CardHeader>
      <Input className="mt-4" placeholder="Alert ID" value={query} onChange={(e) => setQuery(e.target.value)} />
      <CardDivider />
      <SiloCardBody query={query} />
    </Card>
  );
}
