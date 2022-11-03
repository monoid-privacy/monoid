import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from 'react-router-dom';
import AppContainer from '../layout/AppContainer';
import WorkspaceSelect from './Onboarding/WorkspaceAutoSelect';
import SiloRoutes from './Silos/SiloRoutes';

export default function MonoidRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceSelect />} />
        <Route path="workspaces">
          <Route index element={<WorkspaceSelect />} />
          <Route path=":id" element={<AppContainer><Outlet /></AppContainer>}>
            <Route path="silos/*" element={<SiloRoutes />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
