import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from 'react-router-dom';
import AppContainer from '../layout/AppContainer';
import WorkspaceAlertsPage from './Alerts/WorkspaceAlertsPage';
import DashboardPage from './Dashboard/DashboardPage';
import WorkspaceSelect from './Onboarding/WorkspaceAutoSelect';
import WorkspaceScansPage from './Scans/WorkspaceScansPage';
import SettingsPage from './Settings/SettingsPage';
import SiloRoutes from './Silos/SiloRoutes';
import RequestRoutes from './Requests/RequestRoutes';

export default function MonoidRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceSelect />} />
        <Route path="workspaces">
          <Route index element={<WorkspaceSelect />} />
          <Route path=":id" element={<AppContainer><Outlet /></AppContainer>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="alerts" element={<WorkspaceAlertsPage />} />
            <Route path="scans" element={<WorkspaceScansPage />} />
            <Route path="silos/*" element={<SiloRoutes />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="requests/*" element={<RequestRoutes />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
