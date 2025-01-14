import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Banana } from 'lucide-react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateProp from './pages/CreateProp';
import PropDetails from './pages/PropDetails';
import WagerDetails from './pages/WagerDetails';
import SharedPropView from './pages/SharedPropView';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/wager/:id" element={<SharedPropView />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateProp />} />
            <Route path="/prop/:id" element={<PropDetails />} />
            <Route path="/bet/:id" element={<WagerDetails />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;