import React from 'react';
import AlertsCard from './components/AlertsCard';
import RequestsCard from './components/RequestsCard';
import ScansCard from './components/ScansCard';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <RequestsCard />
      <div className="flex flex-col lg:flex-row gap-4">
        <AlertsCard />
        <ScansCard />
      </div>
    </div>
  );
}
