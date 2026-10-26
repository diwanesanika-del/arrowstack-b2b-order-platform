import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';

import { CatalogPage } from './pages/CatalogPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { OrderHistoryPage } from './pages/OrderHistoryPage.tsx';
import { OrderDetailPage } from './pages/OrderDetailPage.tsx';
import { InvoicesListPage } from './pages/InvoicesListPage.tsx';
import { InvoiceViewPage } from './pages/InvoiceViewPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { AdminProductManagementPage } from './pages/AdminProductManagementPage.tsx';
import { AdminOrderManagementPage } from './pages/AdminOrderManagementPage.tsx';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';

const MainAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('catalog');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { isAdmin } = useAuth();

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    setCurrentTab('order-detail');
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentTab('invoice-detail');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 pb-16">
        {currentTab === 'catalog' && (
          <CatalogPage />
        )}

        {currentTab === 'cart' && (
          <CartPage
            setCurrentTab={setCurrentTab}
            setSelectedOrderId={handleSelectOrder}
            setSelectedInvoiceId={handleSelectInvoice}
          />
        )}

        {currentTab === 'orders' && (
          <OrderHistoryPage
            onSelectOrder={handleSelectOrder}
            onSelectInvoice={handleSelectInvoice}
          />
        )}

        {currentTab === 'order-detail' && selectedOrderId && (
          <OrderDetailPage
            orderId={selectedOrderId}
            onBack={() => setCurrentTab(isAdmin ? 'admin-orders' : 'orders')}
            onSelectInvoice={handleSelectInvoice}
          />
        )}

        {currentTab === 'invoices' && (
          <InvoicesListPage onSelectInvoice={handleSelectInvoice} />
        )}

        {currentTab === 'invoice-detail' && selectedInvoiceId && (
          <InvoiceViewPage
            invoiceId={selectedInvoiceId}
            onBack={() => setCurrentTab(isAdmin ? 'admin-orders' : 'invoices')}
          />
        )}

        {currentTab === 'admin-dashboard' && (
          <AdminDashboardPage
            setCurrentTab={setCurrentTab}
            setSelectedOrderId={handleSelectOrder}
          />
        )}

        {currentTab === 'admin-products' && (
          <AdminProductManagementPage />
        )}

        {currentTab === 'admin-orders' && (
          <AdminOrderManagementPage
            onSelectOrder={handleSelectOrder}
            onSelectInvoice={handleSelectInvoice}
          />
        )}

        {currentTab === 'admin-audit' && (
          <AdminAuditLogsPage />
        )}

        {currentTab === 'login' && (
          <LoginPage setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'register' && (
          <RegisterPage setCurrentTab={setCurrentTab} />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-xs border-t border-slate-800 no-print">
        <p className="font-semibold text-slate-300">
          Apex Wholesale Distributors • Enterprise B2B Order Management Platform
        </p>
        <p className="mt-1 text-slate-500">
          Arrowstack Full Stack Development Internship Portfolio Project • PostgreSQL ACID Transactions • Role-Based Access Control
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainAppContent />
      </CartProvider>
    </AuthProvider>
  );
}
