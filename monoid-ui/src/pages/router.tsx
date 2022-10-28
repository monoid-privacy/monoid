import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';
import AppContainer from '../layout/AppContainer';
import WorkspaceSelect from './Onboarding/WorkspaceSelect';

export default function MonoidRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceSelect />} />
        <Route element={<AppContainer />}>
          <Route path="/workspaces">
            <Route index element={<div />} />
            <Route path=":id" element={<div />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
