import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import AppContainer from '../layout/AppContainer';
import WorkspaceAlertsPage from './Alerts/WorkspaceAlertsPage';
import DashboardPage from './Dashboard/DashboardPage';
import WorkspaceSelect from './Onboarding/WorkspaceAutoSelect';
import WorkspaceScansPage from './Scans/WorkspaceScansPage';
import SettingsPage from './Settings/SettingsPage';
import SiloRoutes from './Silos/SiloRoutes';
import RequestRoutes from './Requests/RequestRoutes';
import IdentifierRoutes from './Identifiers/IdentifierRoutes';
import DataMapPage from './DataMap/DataMapPage';

export function WorkspaceRoutes() {
  return (
    <Routes>
      <Route element={<Navigate to="dashboard" />} index />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="alerts" element={<WorkspaceAlertsPage />} />
      <Route path="scans" element={<WorkspaceScansPage />} />
      <Route path="data_map" element={<DataMapPage />} />
      <Route path="silos/*" element={<SiloRoutes />} />
      <Route path="requests/*" element={<RequestRoutes />} />
      <Route path="identifiers/*" element={<IdentifierRoutes />} />
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default function MonoidRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceSelect />} />
        <Route path="workspaces">
          <Route index element={<WorkspaceSelect />} />
          <Route path=":id/*" element={<AppContainer><WorkspaceRoutes /></AppContainer>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
