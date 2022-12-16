import dataMapCache from './dataMap';
import discoveriesCache from './discoveries';
import jobsQueryCache from './jobs';
import requestsCache from './requests';
import requestStatusCache from './requestStatus';

export default {
  typePolicies: {
    Request: {
      fields: {
        requestStatuses: requestStatusCache(),
      },
    },
    SiloDefinition: {
      fields: {
        discoveries: discoveriesCache(),
      },
    },
    DataMapRow: {
      keyFields: ['siloDefinition', ['id'], 'property', ['id'], 'dataSource', ['id']],
    },
    Workspace: {
      fields: {
        jobs: jobsQueryCache(),
        discoveries: discoveriesCache(),
        requests: requestsCache(),
        dataMap: dataMapCache(),
      },
    },
  },
};
