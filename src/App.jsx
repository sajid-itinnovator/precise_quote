import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Hub from './pages/Hub';
import Builder from './pages/Builder';
import History from './pages/History';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Landing from './pages/Landing';

const PAGE_TITLES = {
  '/': 'Vistara Interiors',
  '/builder': 'Quotation Builder',
  '/history': 'Quotation History',
  '/products': 'Products',
  '/clients': 'Clients',
};

function ProtectedRoute({ children, requireAdmin }) {
  const { currentUser, userProfile, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="mt-3 text-muted">Checking Authentication...</h4>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (requireAdmin && userProfile?.role !== 'admin') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <button className="btn btn-primary" onClick={() => window.location.href='/'}>Go Home</button>
      </div>
    );
  }

  return children;
}

function AppRoutes() {
  const { loading } = useApp();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="mt-3 text-muted">Syncing with Cloud...</h4>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout title="Dashboard"><Hub /></Layout></ProtectedRoute>} />
      <Route path="/builder" element={<ProtectedRoute><Layout title="Quotation Builder"><Builder /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout title="Quotation History"><History /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Layout title="Products"><Products /></Layout></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Layout title="Clients"><Clients /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Layout title="User Management"><Admin /></Layout></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
