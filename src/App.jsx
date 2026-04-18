import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import Hub from './pages/Hub';
import Builder from './pages/Builder';
import History from './pages/History';
import Products from './pages/Products';
import Clients from './pages/Clients';

const PAGE_TITLES = {
  '/': 'Vistara Interiors',
  '/builder': 'Quotation Builder',
  '/history': 'Quotation History',
  '/products': 'Products',
  '/clients': 'Clients',
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout title="Vistara Interiors"><Hub /></Layout>} />
      <Route path="/builder" element={<Layout title="Quotation Builder"><Builder /></Layout>} />
      <Route path="/history" element={<Layout title="Quotation History"><History /></Layout>} />
      <Route path="/products" element={<Layout title="Products"><Products /></Layout>} />
      <Route path="/clients" element={<Layout title="Clients"><Clients /></Layout>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
