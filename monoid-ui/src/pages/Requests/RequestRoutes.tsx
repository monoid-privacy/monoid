import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RequestIndex from './pages/RequestIndexPage/RequestIndex';
import RequestPage from './pages/RequestPage/RequestPage';
import NewRequestPage from './pages/NewRequestPage/NewRequestPage';

export default function RequestRoutes() {
  return (
    <Routes>
      <Route index element={<RequestIndex />} />
      <Route path="new" element={<NewRequestPage />} />
      <Route path=":requestId">
        <Route index element={<Navigate to="primary_key_values" />} />
        <Route path="request_statuses" element={<RequestPage tab="request_statuses" />} />
        <Route path="primary_key_values" element={<RequestPage tab="primary_key_values" />} />
      </Route>
    </Routes>
  );
}
