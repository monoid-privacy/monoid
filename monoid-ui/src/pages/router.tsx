import React, { useContext } from 'react';
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
import WorkspaceContext, { WorkspaceProvider } from '../contexts/WorkspaceContext';
import AlertRegion from '../components/AlertRegion';
import LoadingPage from '../common/LoadingPage';
import OnboardingFlow from './Onboarding/OnboardingFlow';

export function WorkspaceRoutes(props: {
  children?: React.ReactNode
}) {
  const { workspace, loading, error } = useContext(WorkspaceContext);
  const { children } = props;

  if (error) {
    return (
      <AlertRegion alertTitle="Error">
        {error.message}
      </AlertRegion>
    );
  }

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Routes>
      <Route
        element={(
          <Navigate to={
            workspace && !workspace.onboardingComplete ? 'onboarding' : 'dashboard'
          }
          />
        )}
        index
      />
      {children}
      {workspace && !workspace.onboardingComplete && <Route path="onboarding" element={<OnboardingFlow />} />}
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

WorkspaceRoutes.defaultProps = {
  children: undefined,
};

export default function MonoidRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceSelect />} />
        <Route path="workspaces">
          <Route index element={<WorkspaceSelect />} />
          <Route
            path=":id/*"
            element={(
              <WorkspaceProvider>
                <AppContainer>
                  <WorkspaceRoutes />
                </AppContainer>
              </WorkspaceProvider>
            )}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
