import React from 'react';
import { Route, Routes } from 'react-router-dom';
import NewPrimaryKeyPage from './pages/NewPrimaryKeyPage/NewPrimaryKeyPage';
import UserIdentifiersList from './pages/UserIdentifiersList/UserIdentifiersList';

export default function IdentifierRoutes() {
  return (
    <Routes>
      <Route index element={<UserIdentifiersList />} />
      <Route path="new" element={<NewPrimaryKeyPage />} />
    </Routes>
  );
}
