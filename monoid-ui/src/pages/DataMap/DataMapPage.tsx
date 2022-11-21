import { gql, useQuery } from '@apollo/client';
import { PlusIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AlertRegion from '../../components/AlertRegion';
import Badge from '../../components/Badge';
import FilterRegion, { FilterValue } from '../../components/FilterRegion';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import Table from '../../components/Table';
import { Category, SiloDefinition } from '../../lib/models';

const DATA_MAP_QUERY = gql`
  query DataMapQuery($workspaceId: ID!, $limit: Int!, $offset: Int, $query: DataMapQuery) {
    workspace(id: $workspaceId) {
      id
      dataMap(limit: $limit, offset: $offset, query: $query) {
        dataMapRows {
          siloDefinition {
            id
            name
          }
          property {
            id
            name
            categories {
              id
              name
            }
          }
          dataSource {
            id
            name
          }
        }
        numRows
      }
    }
  }
`;

const FILTER_OPTIONS_QUERY = gql`
  query FilterOptionsQuery($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      siloDefinitions {
        id
        name
        siloSpecification {
          id
          logoUrl
        }
      }
      categories {
        id
        name
      }
    }
  }
`;
function DataMapList(props: { filters: FilterValue[] }) {
  const [offset, setOffset] = useState(0);
  const { filters } = props;
  const { id } = useParams<{ id: string }>();

  const dataMapVars = useMemo(() => {
    const filterVars: {
      categories?: {
        anyCategory?: boolean,
        noCategory?: boolean
        categoryIDs?: string[]
      },
      siloDefinitions?: string[]
    } = {
      categories: undefined,
      siloDefinitions: [],
    };

    filters.forEach((v) => {
      if (v.name === 'Category') {
        filterVars.categories = {
          anyCategory: v.value.includes('any'),
          noCategory: v.value.includes('none'),
          categoryIDs: v.value.filter((c) => c !== 'any' && c !== 'none'),
        };
      }

      if (v.name === 'Data Silos') {
        filterVars.siloDefinitions = v.value;
      }
    });

    return filterVars;
  }, [filters]);

  const {
    data, loading, error, fetchMore,
  } = useQuery(DATA_MAP_QUERY, {
    variables: {
      query: dataMapVars,
      limit: 10,
      workspaceId: id,
      offset,
    },
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <AlertRegion alertTitle="Error">{error.message}</AlertRegion>;
  }

  return (
    <Table
      tableCols={[
        {
          header: 'Data Silo',
          key: 'data_silo',
        },
        {
          header: 'Data Source',
          key: 'data_source',
        },
        {
          header: 'Property',
          key: 'property',
        },
        {
          header: 'Categories',
          key: 'categories',
        },
      ]}
      tableRows={
        data.workspace.dataMap.dataMapRows.map((r: any) => ({
          key: r.dataSource.id + r.property.id,
          columns: [{
            content: r.siloDefinition.name,
            key: 'silo',
          }, {
            content: r.dataSource.name,
            key: 'data_source',
          }, {
            content: (<code>{r.property.name}</code>),
            key: 'property',
          }, {
            content: (
              r.property.categories[0] && (
                <Badge>
                  {r.property.categories[0].name}
                </Badge>
              )
            ),
            key: 'categories',
          }],
        }))
      }
      footer={(
        <Pagination
          limit={10}
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
          totalCount={data.workspace.dataMap.numRows}
        />
      )}
    />
  );
}

function CategoryTag(props: {
  categories: Category[],
  value: FilterValue,
}) {
  const { value, categories } = props;

  const categoryMap = useMemo(() => (
    Object.fromEntries(categories.map((c) => [c.id, c]))
  ), [categories]);

  let res = null;
  value.value.forEach((val) => {
    if (val === 'none') {
      res = <div>is empty</div>;
    } else if (val === 'any') {
      res = <div>is not empty</div>;
    }
  });

  if (res) {
    return res;
  }

  return (
    <div className="flex items-center space-x-1">
      <div>is in</div>
      <div className="flex items-center space-x-1">
        {value.value.map((val) => (
          <Badge key={val}>{categoryMap[val].name}</Badge>
        ))}
      </div>
    </div>
  );
}

function SiloDefTag(props: {
  siloDefs: SiloDefinition[],
  value: FilterValue,
}) {
  const { value, siloDefs } = props;

  const siloDefMap = useMemo(() => (
    Object.fromEntries(siloDefs.map((sd) => [sd.id, sd]))
  ), [siloDefs]);

  return (
    <div className="flex items-center space-x-1">
      <div>is in</div>
      <div className="flex items-center space-x-1">
        {value.value.map((val) => (
          <Badge key={val} color="white">{siloDefMap[val].name}</Badge>
        ))}
      </div>
    </div>
  );
}

function DataMapFilterRegion(props: {
  onChange: (v: FilterValue[]) => void,
  value: FilterValue[],
}) {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{
    workspace: {
      categories: Category[],
      siloDefinitions: SiloDefinition[]
    }
  }>(FILTER_OPTIONS_QUERY, {
    variables: {
      workspaceId: id!,
    },
  });
  const { onChange, value } = props;

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <AlertRegion alertTitle="Error">{error.message}</AlertRegion>;
  }

  const categoryFormat = (v: FilterValue) => (
    <CategoryTag categories={data?.workspace.categories || []} value={v} />
  );

  const siloDefFormat = (v: FilterValue) => (
    <SiloDefTag siloDefs={data?.workspace.siloDefinitions || []} value={v} />
  );

  return (
    <FilterRegion
      filterOptions={[{
        name: 'Category',
        options: [
          {
            key: 'any',
            content: 'Any Data Category',
          },
          {
            key: 'none',
            content: 'No Data Category',
          },
          ...(data?.workspace.categories.map((c: Category) => ({
            key: c.id!,
            content: <Badge>{c.name}</Badge>,
          })) || []),
        ],
        formatTag: categoryFormat,
      }, {
        name: 'Data Silos',
        options: data?.workspace.siloDefinitions.map((d: SiloDefinition) => ({
          key: d.id!,
          content: d.name,
        })) || [],
        formatTag: siloDefFormat,
      }]}
      onChange={onChange}
      value={value}
    >
      <div className="flex items-center space-x-1">
        <div>
          Filters
        </div>
        <PlusIcon className="h-5 w-5" />
      </div>
    </FilterRegion>
  );
}

export default function DataMapPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const setFilters = (val: FilterValue[]) => {
    const params = new URLSearchParams();

    const filterMap = Object.fromEntries(
      val.map((f) => [f.name, f.value]),
    );

    Object.keys(filterMap).forEach((k) => {
      filterMap[k].forEach((v) => {
        params.append(k, v);
      });
    });

    setSearchParams(params);
  };

  const filters = useMemo(() => {
    const parsedFilters: FilterValue[] = [];
    const category = searchParams.getAll('Category');
    const dataSilo = searchParams.getAll('Data Silos');

    if (category.length !== 0) {
      parsedFilters.push({
        name: 'Category',
        value: category,
      });
    }

    if (dataSilo.length !== 0) {
      parsedFilters.push({
        name: 'Data Silos',
        value: dataSilo,
      });
    }

    return parsedFilters;
  }, [searchParams]);

  useEffect(() => {
    const category = searchParams.has('Category');
    const dataSilo = searchParams.has('Data Silos');

    if (!category && !dataSilo) {
      setFilters([{
        name: 'Category',
        value: ['any'],
      }]);
    }
  }, []);

  return (
    <>
      <PageHeader
        title="Data Map"
      />
      <DataMapFilterRegion onChange={setFilters} value={filters} />
      <DataMapList filters={filters} />
    </>
  );
}
