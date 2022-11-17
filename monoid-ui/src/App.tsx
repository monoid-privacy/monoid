import React from 'react';
import './App.css';

import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import MonoidRouter from './pages/router';
import ToastDisplayer from './components/ToastDisplayer';
import jobsQueryCache from './cache/jobs';
import discoveriesCache from './cache/discoveries';
import requestsCache from './cache/requests';

const client = new ApolloClient({
  uri: `${process.env.REACT_APP_API_URL}/query`,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          jobs: jobsQueryCache(),
        },
      },
      SiloDefinition: {
        fields: {
          discoveries: discoveriesCache(),
        },
      },
      Workspace: {
        fields: {
          jobs: jobsQueryCache(),
          discoveries: discoveriesCache(),
          requests: requestsCache(),
        },
      },
    },
  }),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <ToastDisplayer>
        <MonoidRouter />
      </ToastDisplayer>
    </ApolloProvider>
  );
}

export default App;
