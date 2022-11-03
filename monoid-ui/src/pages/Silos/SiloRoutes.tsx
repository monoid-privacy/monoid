import React from 'react';
import { Route, Routes } from 'react-router-dom';
import NewSiloPage from './pages/NewSiloPage/NewSiloPage';
import SiloIndex from './pages/SiloIndexPage/SiloIndex';

export default function SiloRoutes() {
  return (
    <Routes>
      <Route index element={<SiloIndex />} />
      <Route path="new" element={<NewSiloPage />} />
    </Routes>
  );
}
