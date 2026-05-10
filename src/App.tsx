/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import Frontend from './pages/Frontend';
import Backend from './pages/Backend';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Frontend />} />
          <Route path="/admin" element={<Backend />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
