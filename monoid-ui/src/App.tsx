import React from 'react';
import './App.css';

import { createUploadLink } from 'apollo-upload-client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import config from 'cache/config';
import MonoidRouter from './pages/router';
import ToastDisplayer from './components/ToastDisplayer';

const client = new ApolloClient({
  cache: new InMemoryCache(config),
  // @ts-ignore
  link: createUploadLink({
    uri: `${process.env.REACT_APP_API_URL || ''}/query`,
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
