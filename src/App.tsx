import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import SignUp from './pages/SignUp'; // Importamos la nueva página de registro
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Layout from './components/layout/Layout';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <InventoryProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} /> {/* Nueva ruta de registro */}
              
              {/* Rutas protegidas */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/\" replace />} />
              </Route>
            </Routes>
          </Router>
        </InventoryProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;