import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import NewSiloPage from './pages/NewSiloPage/NewSiloPage';
import SiloIndex from './pages/SiloIndexPage/SiloIndex';
import SiloPage from './pages/SiloPage/SiloPage';

export default function SiloRoutes() {
  return (
    <Routes>
      <Route index element={<SiloIndex />} />
      <Route path="new" element={<NewSiloPage />} />
      <Route path=":siloId">
        <Route index element={<Navigate to="config" />} />
        <Route path="config" element={<SiloPage tab="config" />} />
        <Route path="data_sources" element={<SiloPage tab="data_sources" />} />
      </Route>
    </Routes>
  );
}
