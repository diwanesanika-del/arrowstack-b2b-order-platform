import React, { useState, useEffect } from 'react';
import { orderApi } from '../api/client.ts';
import { Order } from '../types/index.ts';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  AlertCircle,
  Building,
  MapPin,
  Phone,
  AlertTriangle
} from 'lucide-react';

interface OrderDetailPageProps {
  orderId: string;
  onBack: () => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderId,
  onBack,
  onSelectInvoice
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelModal, setCancelModal] = useState<boolean>(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderApi.getOrderById(orderId);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      setCancelling(true);
      const res = await orderApi.updateOrderStatus(order.id, {
        status: 'CANCELLED',
        reason: 'Customer requested order cancellation prior to warehouse processing'
      });
      if (res.success) {
        setCancelModal(false);
        fetchOrder();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const steps = [
    { key: 'PENDING', label: 'Order Submitted', icon: Clock },
    { key: 'CONFIRMED', label: 'Distributor Confirmed', icon: CheckCircle },
    { key: 'PROCESSING', label: 'Warehouse Packing', icon: Package },
    { key: 'SHIPPED', label: 'Freight In Transit', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
  ];

  const getStepIndex = (status: string) => {
    if (status === 'CANCELLED') return -1;
    return steps.findIndex((s) => s.key === status);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
        <p className="mt-2 text-slate-500 text-xs">Loading order record...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-800">Error Loading Order</h3>
          <p className="text-xs text-rose-600 mt-1">{error || 'Order record not found.'}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg"
          >
            Return to Orders
          </button>
        </div>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Order History</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-slate-900 font-mono">
                {order.orderNumber}
              </h1>
              {order.status === 'CANCELLED' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center space-x-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Order Cancelled</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                  {order.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()} • PO Ref: <strong className="text-slate-700 font-mono">{order.poReference || 'N/A'}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {order.status === 'PENDING' && (
              <button
                onClick={() => setCancelModal(true)}
                className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Order</span>
              </button>
            )}

            {order.invoiceId && (
              <button
                onClick={() => onSelectInvoice(order.invoiceId!)}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <FileText className="w-4 h-4" />
                <span>View Invoice ({order.invoiceNumber})</span>
              </button>
            )}
          </div>
        </div>

        {/* Fulfillment Tracking Stepper */}
        {order.status !== 'CANCELLED' && (
          <div className="pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Fulfillment Timeline
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                        : isPassed
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1.5 ${
                        isCurrent
                          ? 'bg-sky-600 text-white'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold block text-slate-800">
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {isCurrent ? 'Current Phase' : isPassed ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Line Items */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Itemized Order Breakdown</h3>
            <span className="text-xs font-mono text-slate-500">
              {order.items?.length || 0} line item(s)
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Product Details</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-6 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                      {item.sku}
                    </span>
                    <h5 className="font-bold text-slate-900 text-xs mt-1">{item.productTitle}</h5>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-600">
                    ${parseFloat(String(item.unitPrice)).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                    ${parseFloat(String(item.lineTotal)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Subtotals Footer */}
          <div className="p-6 bg-slate-50/60 border-t border-slate-100">
            <div className="max-w-xs ml-auto space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-bold">${parseFloat(String(order.subtotal)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Commercial Tax ({parseFloat(String(order.taxRate)) * 100}%)</span>
                <span className="font-mono font-bold">${parseFloat(String(order.taxAmount)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono">${parseFloat(String(order.totalAmount)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Organization Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>Freight Delivery Address</span>
            </h4>

            <div className="text-xs space-y-2 text-slate-700">
              <p className="font-bold text-slate-900">{order.shippingName}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.shippingCity}, {order.shippingPostalCode}
              </p>
              <p>{order.shippingCountry}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center space-x-1.5 text-slate-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{order.contactPhone}</span>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">
                  Delivery Instructions
                </span>
                <p className="text-slate-600 italic mt-0.5">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Business Account</span>
            </h4>
            <div className="text-xs space-y-1 text-slate-600">
              <p className="font-bold text-slate-900">{order.companyName}</p>
              <p>Contact: {order.customerFullName}</p>
              <p className="font-mono">{order.customerEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Confirm Order Cancellation</h3>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">
              Are you sure you want to cancel order <strong>{order.orderNumber}</strong>? The reserved inventory will be automatically returned to the distributor warehouse stock.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCancelModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                No, Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
