import React, { useState, useEffect } from 'react';
import { orderApi } from '../api/client.ts';
import { Order } from '../types/index.ts';
import {
  AlertCircle,
  Filter
} from 'lucide-react';

interface AdminOrderManagementPageProps {
  onSelectOrder: (id: string) => void;
  onSelectInvoice: (id: string) => void;
}

export const AdminOrderManagementPage: React.FC<AdminOrderManagementPageProps> = ({
  onSelectOrder,
  onSelectInvoice
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await orderApi.getOrders(params);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load distributor orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusTransition = async (orderId: string, newStatus: string) => {
    try {
      setTransitioningId(orderId);
      const res = await orderApi.updateOrderStatus(orderId, {
        status: newStatus,
        reason: `Status updated to ${newStatus} by distributor administrator`
      });
      if (res.success) {
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setTransitioningId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Distributor Purchase Order Queue</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Process wholesale fulfillment queues, dispatch freight shipments, and monitor customer invoices.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Fulfillment Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Warehouse Processing</option>
            <option value="SHIPPED">Shipped in Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
          <p className="mt-2 text-slate-500 text-xs">Querying database order records...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-2 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer Account</th>
                  <th className="py-3.5 px-4">Date Placed</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Quick Advance Action</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const isTransitioning = transitioningId === ord.id;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 block">{ord.companyName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{ord.customerEmail}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-mono font-extrabold text-slate-900">
                        ${parseFloat(String(ord.totalAmount)).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          ord.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          ord.status === 'PROCESSING' ? 'bg-indigo-100 text-indigo-800' :
                          ord.status === 'SHIPPED' ? 'bg-sky-100 text-sky-800' :
                          ord.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {/* Status transition controls */}
                        {ord.status === 'PENDING' && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              disabled={isTransitioning}
                              onClick={() => handleStatusTransition(ord.id, 'CONFIRMED')}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow"
                            >
                              Confirm
                            </button>
                            <button
                              disabled={isTransitioning}
                              onClick={() => handleStatusTransition(ord.id, 'CANCELLED')}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {ord.status === 'CONFIRMED' && (
                          <button
                            disabled={isTransitioning}
                            onClick={() => handleStatusTransition(ord.id, 'PROCESSING')}
                            className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shadow"
                          >
                            Mark Processing
                          </button>
                        )}

                        {ord.status === 'PROCESSING' && (
                          <button
                            disabled={isTransitioning}
                            onClick={() => handleStatusTransition(ord.id, 'SHIPPED')}
                            className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] shadow"
                          >
                            Mark Shipped
                          </button>
                        )}

                        {ord.status === 'SHIPPED' && (
                          <button
                            disabled={isTransitioning}
                            onClick={() => handleStatusTransition(ord.id, 'DELIVERED')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow"
                          >
                            Mark Delivered
                          </button>
                        )}

                        {(ord.status === 'DELIVERED' || ord.status === 'CANCELLED') && (
                          <span className="text-[10px] text-slate-400 italic">Terminal state</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => onSelectOrder(ord.id)}
                          className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                        >
                          Details
                        </button>
                        {ord.invoiceId && (
                          <button
                            onClick={() => onSelectInvoice(ord.invoiceId!)}
                            className="px-2.5 py-1.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition"
                          >
                            Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
