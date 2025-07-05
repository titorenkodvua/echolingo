// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
import React from 'react';
import { HomePage } from './pages/HomePage';
import { MaterialEditPage } from './pages/MaterialEditPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/materials/:id/edit" element={<MaterialEditPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 