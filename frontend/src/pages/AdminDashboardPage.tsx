import React, { useState, useEffect } from 'react';
import { adminApi, productApi } from '../api/client.ts';
import { DashboardMetrics } from '../types/index.ts';
import {
  DollarSign,
  AlertTriangle,
  Users,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface AdminDashboardPageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedOrderId: (id: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  setCurrentTab,
  setSelectedOrderId
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Restock Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState<any | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<number>(20);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Restocked from warehouse shipment');
  const [adjusting, setAdjusting] = useState<boolean>(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleQuickAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    try {
      setAdjusting(true);
      await productApi.adjustInventory(adjustModalProduct.id, {
        stockAdjustment: Number(stockAdjustment),
        reason: adjustmentReason
      });
      setAdjustModalProduct(null);
      fetchMetrics();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
        <p className="mt-2 text-slate-500 text-xs">Computing real-time distributor analytics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-800">Analytics Error</h3>
          <p className="text-xs text-rose-600 mt-1">{error || 'Could not fetch metrics.'}</p>
          <button
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
            <span>Operations & Inventory Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Distributor Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Live database metrics aggregated across wholesale purchases, active stock levels, and order fulfillment queues.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Card 1: Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Wholesale Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-mono font-black text-2xl text-slate-900">
            ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Calculated from confirmed non-cancelled orders</span>
          </p>
        </div>

        {/* Card 2: Orders Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Purchase Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-mono font-black text-2xl text-slate-900">
            {metrics.orderStats.total}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-amber-600">{metrics.orderStats.pending} pending</strong> review • {metrics.orderStats.shipped + metrics.orderStats.processing} active
          </p>
        </div>

        {/* Card 3: Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stock Warnings
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-mono font-black text-2xl text-slate-900">
            {metrics.productStats.lowStockCount + metrics.productStats.outOfStockCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-rose-600">{metrics.productStats.outOfStockCount} out of stock</strong> • {metrics.productStats.lowStockCount} below threshold
          </p>
        </div>

        {/* Card 4: Customers & Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Wholesale Accounts
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-mono font-black text-2xl text-slate-900">
            {metrics.totalCustomers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {metrics.productStats.totalProducts} cataloged wholesale products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Low Stock Alerts & Quick Restock Table */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Low Stock Re-Order Alerts</h3>
            </div>
            <button
              onClick={() => setCurrentTab('admin-products')}
              className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center space-x-1"
            >
              <span>Manage All Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {metrics.lowStockAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">All inventory levels are healthy.</p>
              <p>No products are currently under their low-stock safety threshold.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.lowStockAlerts.map((prod) => (
                <div key={prod.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                      {prod.sku}
                    </span>
                    <h5 className="font-bold text-slate-900 mt-0.5">{prod.title}</h5>
                    <span className="text-slate-400 text-[11px]">Category: {prod.category}</span>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-right">
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        prod.stock === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {prod.stock === 0 ? '0 in stock' : `${prod.stock} left`}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Min: {prod.lowStockThreshold}
                      </span>
                    </div>

                    <button
                      onClick={() => setAdjustModalProduct(prod)}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Wholesale Orders */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">Recent Purchase Orders</h3>
            </div>
            <button
              onClick={() => setCurrentTab('admin-orders')}
              className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center space-x-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.recentOrders.map((ord) => (
              <div key={ord.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5 font-medium">{ord.companyName}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="font-mono font-extrabold text-slate-900">
                    ${parseFloat(String(ord.totalAmount)).toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedOrderId(ord.id);
                      setCurrentTab('order-detail');
                    }}
                    className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Restock Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-base">
              Adjust Inventory: {adjustModalProduct.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              SKU: {adjustModalProduct.sku} • Current Stock: <strong>{adjustModalProduct.stock}</strong>
            </p>

            <form onSubmit={handleQuickAdjust} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Stock Units Adjustment (+ to restock, - to deduct)
                </label>
                <input
                  type="number"
                  required
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  New Resulting Stock: <strong>{adjustModalProduct.stock + Number(stockAdjustment)}</strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Audit Trail (Mandatory)
                </label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="e.g. Received shipment PO-881 from factory"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow"
                >
                  {adjusting ? 'Updating...' : 'Commit Stock Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
