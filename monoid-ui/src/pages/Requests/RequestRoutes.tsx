import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RequestIndex from './pages/RequestIndexPage/RequestIndex';
import RequestPage from './pages/RequestPage/RequestPage';
import NewRequestPage from './pages/NewRequestPage/NewRequestPage';
import NewPrimaryKeyPage from './pages/NewPrimaryKeyPage/NewPrimaryKeypage';

export default function RequestRoutes() {
  return (
    <Routes>
      <Route index element={<RequestIndex />} />
      <Route path="new" element={<NewRequestPage />} />
      <Route path="new_primary_key" element={<NewPrimaryKeyPage />} />
      <Route path=":requestId">
        <Route index element={<Navigate to="primary_key_values" />} />
        <Route path="request_statuses" element={<RequestPage tab="request_statuses" />} />
        <Route path="primary_key_values" element={<RequestPage tab="primary_key_values" />} />
      </Route>
      {/* <Route index element={<SiloIndex />} />
      <Route path="new" element={<NewSiloPage />} />
      <Route path=":siloId">
        <Route index element={<Navigate to="data_sources" />} />
        <Route path="settings" element={<SiloPage tab="settings" />} />
        <Route path="data_sources" element={<SiloPage tab="data_sources" />} />
        <Route path="scanning" element={<SiloPage tab="scanning" />} />
        <Route path="alerts" element={<SiloPage tab="alerts" />} />
      </Route> */}
    </Routes>
  );
}
