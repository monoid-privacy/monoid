import {
  ApolloError, useMutation, useQuery,
} from '@apollo/client';

import React, {
  useContext, useEffect, useState,
} from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  BellAlertIcon,
  CheckCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import { classNames } from 'utils/utils';
import { gql } from '__generated__/gql';
import { DiscoveryAction, DiscoveryStatus } from '__generated__/graphql';
import useQueryPatched from '../../../../../hooks/useQueryPatched';
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

const GET_NUM_ACTIVE_DISCOVERIES = gql(`
  query GetNumActiveDiscoveries($id: ID!) {
    siloDefinition(id: $id) {
      id
      discoveries(limit: 1, offset: 0, statuses: [OPEN]) {
        numDiscoveries
      }
    }
  }
`);

const APPLY_ALL_DISCOVERIES = gql(`
  mutation ApplyAllDiscoveries($input: HandleAllDiscoveriesInput!) {
    handleAllOpenDiscoveries(input: $input) {
      id
      status
    }
  }
`);

const limit = 10;

export function SiloAlertsTabHeader() {
  const { siloId } = useParams<{ siloId: string }>();
  const { data, loading, error } = useQuery(GET_NUM_ACTIVE_DISCOVERIES, {
    variables: {
      id: siloId!,
    },
  });

  let badge: React.ReactNode;

  if (!loading && !error
    && data?.siloDefinition?.discoveries?.numDiscoveries !== 0) {
    badge = (
      <Badge size="sm">
        {data?.siloDefinition?.discoveries?.numDiscoveries}
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

export function SiloAlertCardBody(props: {
  query?: string,
  siloId?: string,
  statuses?: DiscoveryStatus[]
  hideEmptyAction?: boolean,
  emptyMessage?: string,
}) {
  const { siloId: paramSiloId, id } = useParams<{ siloId: string, id: string }>();
  const {
    query, siloId: propSiloId, statuses, hideEmptyAction, emptyMessage,
  } = props;
  const siloId = propSiloId || paramSiloId;

  const toastCtx = useContext(ToastContext);

  const [offset, setOffset] = useState(0);
  const vars = {
    id: siloId!,
    query: query && query.trim() !== '' ? query : undefined,
    statuses: statuses || [],
    limit,
    offset,
  };
  const {
    data, loading, error, fetchMore, refetch,
  } = useQueryPatched(GET_DISCOVERIES, {
    variables: vars,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: () => 'cache-first',
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

  if (data?.siloDefinition.discoveries.discoveries.length === 0) {
    return (
      <EmptyState
        icon={BellAlertIcon}
        title="No Alerts"
        subtitle={emptyMessage || 'Alerts will be created when you run a scan.'}
        className="py-7"
        action={!hideEmptyAction && (
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
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-gray-200">
        {
          (data?.siloDefinition.discoveries.discoveries || []).map((d) => (
            <DataDiscoveryRow key={d!.id} discovery={d as DataDiscovery} />
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
        totalCount={data?.siloDefinition?.discoveries?.numDiscoveries || 0}
      />
    </>
  );
}

SiloAlertCardBody.defaultProps = {
  query: undefined,
  siloId: undefined,
  statuses: [],
  hideEmptyAction: false,
  emptyMessage: 'Alerts will be created when you run a scan.',
};

export function ApplyAlertsButton(props: {
  siloId?: string,
  className?: string,
  onSuccess: () => void
}) {
  const { siloId: paramSiloId, id } = useParams<{ siloId: string, id: string }>();
  const { siloId: propSiloId, onSuccess, className } = props;
  const siloId = propSiloId || paramSiloId;

  const toastCtx = useContext(ToastContext);

  const {
    data, loading, error, refetch,
  } = useQuery(GET_NUM_ACTIVE_DISCOVERIES, {
    variables: {
      id: siloId!,
      workspaceId: id,
    },
  });

  const [handleDiscoveries, handleDiscoveriesRes] = useMutation(APPLY_ALL_DISCOVERIES, {
    variables: {
      input: {
        siloId: siloId!,
        action: DiscoveryAction.Accept,
      },
    },
    update: (cache, res) => {
      ((res.data?.handleAllOpenDiscoveries || []) as DataDiscovery[]).forEach((v) => {
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

  const numDiscoveries = data?.siloDefinition?.discoveries?.numDiscoveries;
  if (loading || error || numDiscoveries === 0) {
    return <div />;
  }

  if (error) {
    return <div />;
  }

  return (
    <Button
      className={classNames('ml-auto', className)}
      onClick={() => handleDiscoveries().then(() => {
        onSuccess();
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

ApplyAlertsButton.defaultProps = {
  siloId: undefined,
  className: '',
};

export default function SiloAlerts() {
  const [query, setQuery] = useState('');
  const location = useLocation();
  const toastCtx = useContext(ToastContext);

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
        {query.trim() === '' ? (
          <ApplyAlertsButton onSuccess={() => {
            toastCtx.showToast({
              title: 'Success',
              message: 'Applied alerts!',
              variant: 'success',
              icon: CheckCircleIcon,
            });
          }}
          />
        ) : <div />}
      </CardHeader>
      <Input className="mt-4" placeholder="Alert ID" value={query} onChange={(e) => setQuery(e.target.value)} />
      <CardDivider />
      <SiloAlertCardBody query={query} />
    </Card>
  );
}
