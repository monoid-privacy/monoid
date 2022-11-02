import React from 'react';
import PageCenter from '../components/PageCenter';
import Spinner from '../components/Spinner';

export default function LoadingPage() {
  return (
    <PageCenter>
      <Spinner size="lg" />
    </PageCenter>
  );
}
