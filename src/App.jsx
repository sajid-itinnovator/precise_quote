import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Hub from './pages/Hub';
import Builder from './pages/Builder';
import History from './pages/History';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Landing from './pages/Landing';
import CompanyProfile from './pages/CompanyProfile';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SuperAdmin from './pages/SuperAdmin';
import { getDomainContext } from './utils/domainRouting';

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
  const domain = getDomainContext();

  // If visiting Super Admin dedicated subdomain/host, root directly serves SuperAdmin console
  if (domain.isSuperAdminHost) {
    return (
      <Routes>
        <Route path="/" element={<SuperAdmin />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="*" element={<SuperAdmin />} />
      </Routes>
    );
  }

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
      {/* If accessed via dedicated tenant subdomain e.g. vistarainteriors.precisequote.web.app, root is tenant portal/login */}
      <Route path="/" element={domain.tenantSubdomain ? <Login /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout title="Dashboard"><Hub /></Layout></ProtectedRoute>} />
      <Route path="/builder" element={<ProtectedRoute><Layout title="Quotation Builder"><Builder /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout title="Quotation History"><History /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Layout title="Products"><Products /></Layout></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Layout title="Clients"><Clients /></Layout></ProtectedRoute>} />
      <Route path="/company-profile" element={<ProtectedRoute><Layout title="Company Profile"><CompanyProfile /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Layout title="User Management"><Admin /></Layout></ProtectedRoute>} />
      <Route path="/super-admin" element={<SuperAdmin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
