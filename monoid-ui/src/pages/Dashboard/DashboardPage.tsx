import React from 'react';
import AlertsCard from './components/AlertsCard';
import ScansCard from './components/ScansCard';

export default function DashboardPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <AlertsCard />
      <ScansCard />
    </div>
  );
}
