import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import {
  Package,
  ShoppingCart,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  LogIn,
  Layers
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, isAdmin, isCustomer } = useAuth();
  const { totalQuantity } = useCart();

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
      {/* Top micro banner */}
      <div className="bg-slate-950 py-1 px-4 text-xs text-slate-400 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Apex Wholesale Supply Direct • Enterprise Distribution Portal</span>
        </div>
        {user ? (
          <div className="flex items-center space-x-3">
            <span>
              Logged in as <strong className="text-slate-200">{user.fullName}</strong> ({user.companyName})
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'bg-amber-500 text-slate-950' : 'bg-sky-600 text-white'}`}>
              {user.role}
            </span>
          </div>
        ) : (
          <span>Demo Access Available • Admin & Customer credentials pre-loaded</span>
        )}
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Brand */}
        <div
          onClick={() => setCurrentTab('catalog')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              <span>APEX</span>
              <span className="text-sky-400 font-light">WHOLESALE</span>
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
              B2B Order Platform
            </div>
          </div>
        </div>

        {/* Center navigation links */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
              currentTab === 'catalog'
                ? 'bg-slate-800 text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog</span>
          </button>

          {/* Customer Specific Tabs */}
          {isCustomer && (
            <>
              <button
                onClick={() => setCurrentTab('orders')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentTab === 'orders'
                    ? 'bg-slate-800 text-sky-400 border-b-2 border-sky-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>My Orders</span>
              </button>

              <button
                onClick={() => setCurrentTab('invoices')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentTab === 'invoices'
                    ? 'bg-slate-800 text-sky-400 border-b-2 border-sky-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Invoices</span>
              </button>
            </>
          )}

          {/* Admin Specific Tabs */}
          {isAdmin && (
            <>
              <button
                onClick={() => setCurrentTab('admin-dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentTab === 'admin-dashboard'
                    ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentTab('admin-products')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentTab === 'admin-products'
                    ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Products & Stock</span>
              </button>

              <button
                onClick={() => setCurrentTab('admin-orders')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentTab === 'admin-orders'
                    ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>All Orders</span>
              </button>

              <button
                onClick={() => setCurrentTab('admin-audit')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentTab === 'admin-audit'
                    ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Audit Trail</span>
              </button>
            </>
          )}
        </nav>

        {/* Right action controls */}
        <div className="flex items-center space-x-3">
          {/* Cart Icon (Customer or Guest) */}
          <button
            onClick={() => setCurrentTab('cart')}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="View Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center shadow">
                {totalQuantity}
              </span>
            )}
          </button>

          {/* User auth state */}
          {user ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentTab('login')}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center space-x-1 shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => setCurrentTab('register')}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors hidden sm:flex items-center space-x-1"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
